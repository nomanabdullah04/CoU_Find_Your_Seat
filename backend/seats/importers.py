import io
import re
from datetime import datetime, date, time
import pandas as pd
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from django.db import transaction
from .models import Center, Candidate, SeatAssignment, UploadBatch, AuditLog

EXPECTED_COLUMNS = [
    'admission_roll',
    'candidate_name',
    'unit',
    'center_code',
    'center_name',
    'building',
    'room',
    'seat_no',
    'exam_date',
    'exam_time',
    'reporting_time',
]

REQUIRED_FIELDS = [
    'admission_roll',
    'unit',
    'center_code',
    'center_name',
    'building',
    'room',
    'seat_no',
    'exam_date',
    'exam_time',
    'reporting_time',
]


def generate_excel_template() -> io.BytesIO:
    """
    Generates a professional sample Excel template (.xlsx)
    with exact column headers and 3 example rows.
    """
    wb = Workbook()
    ws = wb.active
    ws.title = "Seat Plan Template"

    # Header styling
    header_fill = PatternFill(start_color="0B3D91", end_color="0B3D91", fill_type="solid")
    header_font = Font(name="Segoe UI", size=11, bold=True, color="FFFFFF")
    data_font = Font(name="Segoe UI", size=10)
    thin_border = Border(
        left=Side(style='thin', color='D0D5DD'),
        right=Side(style='thin', color='D0D5DD'),
        top=Side(style='thin', color='D0D5DD'),
        bottom=Side(style='thin', color='D0D5DD')
    )

    ws.append(EXPECTED_COLUMNS)

    for cell in ws[1]:
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = thin_border

    sample_rows = [
        [
            "100245",
            "Rahim Uddin",
            "A",
            "CUC-01",
            "Comilla University Campus",
            "Science Building",
            "204",
            "17",
            "2026-12-05",
            "10:00",
            "09:00",
        ],
        [
            "100246",
            "Fatima Akter",
            "A",
            "CUC-01",
            "Comilla University Campus",
            "Science Building",
            "204",
            "18",
            "2026-12-05",
            "10:00",
            "09:00",
        ],
        [
            "100247",
            "Tanvir Hasan",
            "B",
            "CC-02",
            "Comilla Victoria Govt. College",
            "Degree Building",
            "102",
            "05",
            "2026-12-05",
            "14:00",
            "13:00",
        ],
    ]

    for row_data in sample_rows:
        ws.append(row_data)

    for row in ws.iter_rows(min_row=2, max_row=4):
        for cell in row:
            cell.font = data_font
            cell.border = thin_border
            cell.alignment = Alignment(vertical="center")

    # Auto-adjust column widths
    for col in ws.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = col[0].column_letter
        ws.column_dimensions[col_letter].width = max(max_len + 4, 14)

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output


def parse_date_value(val):
    if pd.isna(val) or val is None:
        return None
    if isinstance(val, (datetime, date)):
        return val.date() if isinstance(val, datetime) else val
    val_str = str(val).strip()
    for fmt in ('%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y', '%m/%d/%Y', '%Y/%m/%d'):
        try:
            return datetime.strptime(val_str, fmt).date()
        except ValueError:
            pass
    return None


def parse_time_value(val):
    if pd.isna(val) or val is None:
        return None
    if isinstance(val, time):
        return val
    if isinstance(val, datetime):
        return val.time()
    val_str = str(val).strip()
    for fmt in ('%H:%M:%S', '%H:%M', '%I:%M %p', '%I:%M%p'):
        try:
            return datetime.strptime(val_str, fmt).time()
        except ValueError:
            pass
    return None


class ExcelSeatPlanValidator:
    def __init__(self, file_source):
        self.file_source = file_source
        self.errors = []
        self.valid_rows = []
        self.total_rows = 0

    def validate(self):
        try:
            df = pd.read_excel(self.file_source, dtype=str)
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to read Excel file: {str(e)}",
                "total_rows": 0,
                "valid_rows_count": 0,
                "errors": [{"row": 0, "field": "file", "message": f"Corrupt or invalid Excel file: {str(e)}"}],
                "valid_rows": []
            }

        # Clean column names
        df.columns = [str(col).strip().lower().replace(' ', '_') for col in df.columns]

        missing_cols = [col for col in REQUIRED_FIELDS if col not in df.columns]
        if missing_cols:
            return {
                "success": False,
                "error": f"Missing required column headers: {', '.join(missing_cols)}",
                "total_rows": len(df),
                "valid_rows_count": 0,
                "errors": [{"row": 1, "field": "header", "message": f"Missing headers: {', '.join(missing_cols)}"}],
                "valid_rows": []
            }

        self.total_rows = len(df)
        seen_rolls = {}
        seen_seats = {}

        # Fetch existing center codes
        existing_center_codes = set(Center.objects.values_list('code', flat=True))

        for idx, row in df.iterrows():
            row_num = idx + 2  # 1-based index + header row
            row_errors = []

            # Check required fields
            for req in REQUIRED_FIELDS:
                val = row.get(req)
                if pd.isna(val) or val is None or str(val).strip() == '':
                    row_errors.append({
                        "row": row_num,
                        "field": req,
                        "message": f"Field '{req}' cannot be empty."
                    })

            roll = str(row.get('admission_roll', '')).strip()
            if roll:
                if roll in seen_rolls:
                    row_errors.append({
                        "row": row_num,
                        "field": "admission_roll",
                        "message": f"Duplicate roll '{roll}' in file (first seen at row {seen_rolls[roll]})."
                    })
                else:
                    seen_rolls[roll] = row_num

            # Validate date
            exam_date_raw = row.get('exam_date')
            parsed_date = parse_date_value(exam_date_raw)
            if exam_date_raw and not parsed_date:
                row_errors.append({
                    "row": row_num,
                    "field": "exam_date",
                    "message": f"Invalid date '{exam_date_raw}'. Expected YYYY-MM-DD or DD-MM-YYYY."
                })

            # Validate exam_time
            exam_time_raw = row.get('exam_time')
            parsed_exam_time = parse_time_value(exam_time_raw)
            if exam_time_raw and not parsed_exam_time:
                row_errors.append({
                    "row": row_num,
                    "field": "exam_time",
                    "message": f"Invalid exam_time '{exam_time_raw}'. Expected HH:MM."
                })

            # Validate reporting_time
            rep_time_raw = row.get('reporting_time')
            parsed_rep_time = parse_time_value(rep_time_raw)
            if rep_time_raw and not parsed_rep_time:
                row_errors.append({
                    "row": row_num,
                    "field": "reporting_time",
                    "message": f"Invalid reporting_time '{rep_time_raw}'. Expected HH:MM."
                })

            # Center code check
            center_code = str(row.get('center_code', '')).strip()
            if center_code and center_code not in existing_center_codes:
                row_errors.append({
                    "row": row_num,
                    "field": "center_code",
                    "message": f"Center code '{center_code}' not found in registered Centers. Please add the center first."
                })

            # Check duplicate seat in the same room
            building = str(row.get('building', '')).strip()
            room = str(row.get('room', '')).strip()
            seat_no = str(row.get('seat_no', '')).strip()
            date_key = parsed_date.strftime('%Y-%m-%d') if parsed_date else str(exam_date_raw)
            time_key = parsed_exam_time.strftime('%H:%M') if parsed_exam_time else str(exam_time_raw)

            seat_slot_key = (center_code, building, room, seat_no, date_key, time_key)
            if center_code and building and room and seat_no:
                if seat_slot_key in seen_seats:
                    row_errors.append({
                        "row": row_num,
                        "field": "seat_no",
                        "message": f"Duplicate seat '{seat_no}' in room '{room}', building '{building}' at '{center_code}' (first seen at row {seen_seats[seat_slot_key]})."
                    })
                else:
                    seen_seats[seat_slot_key] = row_num

            if row_errors:
                self.errors.extend(row_errors)
            else:
                self.valid_rows.append({
                    "roll": roll,
                    "candidate_name": str(row.get('candidate_name', '')).strip() if not pd.isna(row.get('candidate_name')) else None,
                    "unit": str(row.get('unit', '')).strip(),
                    "center_code": center_code,
                    "center_name": str(row.get('center_name', '')).strip(),
                    "building": building,
                    "room": room,
                    "seat_no": seat_no,
                    "exam_date": parsed_date,
                    "exam_time": parsed_exam_time,
                    "reporting_time": parsed_rep_time,
                })

        return {
            "success": len(self.errors) == 0,
            "total_rows": self.total_rows,
            "valid_rows_count": len(self.valid_rows),
            "errors": self.errors,
            "valid_rows": self.valid_rows
        }


def execute_batch_import(batch: UploadBatch, valid_rows: list, user=None) -> int:
    """
    Imports valid rows in a single atomic transaction.
    Deactivates previous active batch, activates current batch,
    and logs the action to AuditLog.
    """
    with transaction.atomic():
        # Deactivate all existing active batches
        UploadBatch.objects.filter(is_active=True).exclude(id=batch.id).update(is_active=False)

        # Clear any existing seat assignments for this specific batch before re-populating
        SeatAssignment.objects.filter(batch=batch).delete()

        # Cache centers by code
        centers_by_code = {c.code: c for c in Center.objects.all()}

        seat_assignments = []
        for item in valid_rows:
            center = centers_by_code.get(item['center_code'])
            if not center:
                center = Center.objects.create(
                    code=item['center_code'],
                    name_en=item.get('center_name', item['center_code']),
                    name_bn=item.get('center_name', item['center_code']),
                    address="To be updated",
                    latitude=23.4190,
                    longitude=91.1378,
                )
                centers_by_code[center.code] = center

            candidate, _ = Candidate.objects.update_or_create(
                roll=item['roll'],
                defaults={
                    'name': item['candidate_name'],
                    'unit': item['unit']
                }
            )

            seat_assignments.append(
                SeatAssignment(
                    candidate=candidate,
                    center=center,
                    building=item['building'],
                    room=item['room'],
                    seat_no=item['seat_no'],
                    exam_date=item['exam_date'],
                    exam_time=item['exam_time'],
                    reporting_time=item['reporting_time'],
                    batch=batch
                )
            )

        SeatAssignment.objects.bulk_create(seat_assignments)

        batch.status = 'confirmed'
        batch.is_active = True
        batch.rows_total = len(valid_rows)
        batch.rows_failed = 0
        batch.save()

        # AuditLog
        AuditLog.objects.create(
            user=user,
            action=f"Confirmed and imported batch #{batch.id} with {len(seat_assignments)} seat assignments."
        )

        return len(seat_assignments)


def execute_batch_rollback(batch: UploadBatch, user=None):
    """
    Rolls back the specified batch: deactivates it and reactivates
    the previously confirmed batch.
    """
    with transaction.atomic():
        batch.is_active = False
        batch.save()

        # Delete seat assignments belonging to this rolled back batch
        SeatAssignment.objects.filter(batch=batch).delete()

        # Find previous confirmed batch
        prev_batch = UploadBatch.objects.filter(
            status='confirmed'
        ).exclude(id=batch.id).order_by('-uploaded_at').first()

        prev_id = None
        if prev_batch:
            prev_batch.is_active = True
            prev_batch.save()
            prev_id = prev_batch.id

        AuditLog.objects.create(
            user=user,
            action=f"Rolled back batch #{batch.id}. Previous active batch #{prev_id if prev_id else 'None'} reactivated."
        )

        return prev_batch


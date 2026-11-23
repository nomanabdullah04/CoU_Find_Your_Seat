from django.core.management.base import BaseCommand
from seats.models import SeatAssignment, Candidate, UploadBatch, AuditLog, SearchLog

class Command(BaseCommand):
    help = "Clears all seat assignments, candidates, upload batches, and search logs from the database."

    def add_arguments(self, parser):
        parser.add_argument(
            '--all',
            action='store_true',
            help='Wipes candidates, batches, and logs as well',
        )

    def handle(self, *args, **options):
        seat_count = SeatAssignment.objects.count()
        SeatAssignment.objects.all().delete()
        self.stdout.write(self.style.SUCCESS(f"Deleted {seat_count} seat assignments."))

        if options.get('all'):
            cand_count = Candidate.objects.count()
            batch_count = UploadBatch.objects.count()
            log_count = SearchLog.objects.count()

            Candidate.objects.all().delete()
            UploadBatch.objects.all().delete()
            SearchLog.objects.all().delete()

            self.stdout.write(self.style.SUCCESS(f"Deleted {cand_count} candidates, {batch_count} upload batches, and {log_count} search logs."))
        
        self.stdout.write(self.style.SUCCESS("Database seat data cleared successfully!"))

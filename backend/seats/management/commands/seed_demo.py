import datetime
from django.core.management.base import BaseCommand
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth.models import User
from seats.models import Center, Candidate, UploadBatch, SeatAssignment, SiteSetting, AuditLog
from content.models import Notice, AdmissionStep, FAQ

class Command(BaseCommand):
    help = "Seeds demo centers, candidates, seat assignments, admission steps, FAQs, and notices."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Starting demo data seeding for Admission Seat Finder..."))

        # 0. Ensure Admin Superuser exists
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@cou.ac.bd',
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            admin_user.set_password('Admin@12345')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS("Created demo admin user: admin / Admin@12345"))

        # Site Settings
        setting = SiteSetting.get_settings()
        setting.require_verification = False
        setting.rate_limit_per_minute = 30
        setting.helpdesk_phone = "+880 1711-223344"
        setting.helpdesk_email = "admission@cou.ac.bd"
        setting.save()

        # 1. Demo Centers (1 Campus, 2 City)
        centers_data = [
            {
                "code": "CUC-01",
                "name_en": "Comilla University Campus (Main Center)",
                "name_bn": "কুমিল্লা বিশ্ববিদ্যালয় ক্যাম্পাস (প্রধান কেন্দ্র)",
                "address": "Kotbari, Cumilla - 3506, Bangladesh",
                "latitude": 23.4190200,
                "longitude": 91.1378300,
                "gate_info": "Main Campus Gate (Gate 1)",
                "instructions_en": "Enter Gate 1 -> Science Faculty Building -> 2nd Floor -> Room 204",
                "instructions_bn": "প্রধান গেট (১ নং গেট) দিয়ে প্রবেশ করুন -> বিজ্ঞান অনুষদ ভবন -> ২য় তলা -> রুম ২০৪"
            },
            {
                "code": "CC-02",
                "name_en": "Comilla Victoria Government College (Degree Section)",
                "name_bn": "কুমিল্লা ভিক্টোরিয়া সরকারি কলেজ (ডিগ্রি শাখা)",
                "address": "Dharmasagar South, Kandirpar, Cumilla",
                "latitude": 23.4600100,
                "longitude": 91.1800200,
                "gate_info": "South Gate (Opposite Dharmasagar Dighi)",
                "instructions_en": "South Gate -> Degree Academic Building -> Ground Floor -> Room 102",
                "instructions_bn": "দক্ষিণ গেট (ধর্মসাগর দিঘির বিপরীতে) -> ডিগ্রি অ্যাকাডেমিক ভবন -> নিচতলা -> রুম ১০২"
            },
            {
                "code": "CC-03",
                "name_en": "Comilla Zilla School",
                "name_bn": "কুমিল্লা জিলা স্কুল",
                "address": "Kandirpar Main Road, Cumilla",
                "latitude": 23.4623100,
                "longitude": 91.1834200,
                "gate_info": "East Main Gate",
                "instructions_en": "East Main Gate -> High School Academic Block -> 1st Floor -> Room 15",
                "instructions_bn": "পূর্ব প্রধান গেট -> মাধ্যমিক অ্যাকাডেমিক ব্লক -> ১ম তলা -> রুম ১৫"
            }
        ]

        centers = {}
        for cdata in centers_data:
            center, _ = Center.objects.update_or_create(
                code=cdata['code'],
                defaults=cdata
            )
            centers[center.code] = center
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(centers)} Exam Centers."))

        # 2. Upload Batch (Active & Confirmed)
        UploadBatch.objects.filter(is_active=True).update(is_active=False)
        batch = UploadBatch.objects.create(
            file=SimpleUploadedFile("demo_seat_plan.xlsx", b"DEMO_EXCEL_SEAT_PLAN"),
            uploaded_by=admin_user,
            status='confirmed',
            rows_total=20,
            rows_failed=0,
            is_active=True
        )

        # 3. 20 Demo Candidates & Seat Assignments
        demo_candidates = [
            ("100201", "Rahim Uddin", "A", "4567", "CUC-01", "Science Faculty Building", "204", "01"),
            ("100202", "Fatima Akter", "A", "8821", "CUC-01", "Science Faculty Building", "204", "02"),
            ("100203", "Tanvir Ahmed", "A", "1123", "CUC-01", "Science Faculty Building", "204", "03"),
            ("100204", "Sadia Sultana", "A", "9904", "CUC-01", "Science Faculty Building", "204", "04"),
            ("100205", "Kamrul Hasan", "A", "3345", "CUC-01", "Arts Building", "105", "11"),
            ("100206", "Nusrat Jahan", "A", "6678", "CUC-01", "Arts Building", "105", "12"),
            ("100207", "Mehedi Hasan", "A", "4412", "CUC-01", "Arts Building", "105", "13"),
            ("100208", "Ayesha Siddiqa", "B", "2255", "CC-02", "Degree Academic Building", "102", "01"),
            ("100209", "Shakil Mahmud", "B", "7789", "CC-02", "Degree Academic Building", "102", "02"),
            ("100210", "Tahmina Islam", "B", "9910", "CC-02", "Degree Academic Building", "102", "03"),
            ("100211", "Arifur Rahman", "B", "5543", "CC-02", "Degree Academic Building", "102", "04"),
            ("100212", "Sultana Razia", "B", "8834", "CC-02", "Administrative Block", "201", "21"),
            ("100213", "Fahim Faysal", "B", "4476", "CC-02", "Administrative Block", "201", "22"),
            ("100214", "Roksana Akter", "C", "3321", "CC-03", "High School Academic Block", "15", "05"),
            ("100215", "Jubayer Hossain", "C", "6654", "CC-03", "High School Academic Block", "15", "06"),
            ("100216", "Marufa Begum", "C", "1187", "CC-03", "High School Academic Block", "15", "07"),
            ("100217", "Shahadat Hossain", "C", "9932", "CC-03", "High School Academic Block", "15", "08"),
            ("100218", "Farhana Yeasmin", "C", "7741", "CC-03", "Science Annex", "08", "14"),
            ("100219", "Nazmul Huda", "C", "5519", "CC-03", "Science Annex", "08", "15"),
            ("100220", "Sumaiya Kabir", "C", "8860", "CC-03", "Science Annex", "08", "16"),
        ]

        exam_date_val = datetime.date(2026, 12, 5)
        exam_time_val = datetime.time(10, 0)
        rep_time_val = datetime.time(9, 0)

        for roll, name, unit, vfield, ccode, bldg, rm, sno in demo_candidates:
            cand, _ = Candidate.objects.update_or_create(
                roll=roll,
                defaults={
                    "name": name,
                    "unit": unit,
                    "verify_field": vfield
                }
            )
            SeatAssignment.objects.filter(candidate=cand).delete()
            SeatAssignment.objects.create(
                candidate=cand,
                center=centers[ccode],
                building=bldg,
                room=rm,
                seat_no=sno,
                exam_date=exam_date_val,
                exam_time=exam_time_val,
                reporting_time=rep_time_val,
                batch=batch
            )
        self.stdout.write(self.style.SUCCESS(f"Seeded 20 Demo Candidates and active Seat Assignments."))

        # 4. Admission Steps (Bangla & English)
        steps_data = [
            {
                "order": 1,
                "title_en": "Admission Circular & Press Release",
                "title_bn": "ভর্তি বিজ্ঞপ্তি ও প্রেস রিলিজ প্রকাশ",
                "description_en": "Comilla University has officially published the undergraduate admission circular for session 2026-27.",
                "description_bn": "কুমিল্লা বিশ্ববিদ্যালয় কর্তৃপক্ষ ২০২৬-২৭ শিক্ষাবর্ষের ভর্তি পরীক্ষার বিজ্ঞপ্তি ও সময়সূচি প্রকাশ করেছে।",
                "date": "11 November 2026",
                "link": "https://www.cou.ac.bd"
            },
            {
                "order": 2,
                "title_en": "Check Academic Eligibility Criteria",
                "title_bn": "আবেদনের যোগ্যতা যাচাই",
                "description_en": "Verify that your SSC and HSC GPA satisfy requirements. Students appearing in 2026 HSC Supplementary exams are also eligible to apply.",
                "description_bn": "আপনার এসএসসি ও এইচএসসি জিপিএ যাচাই করুন। ২০২৬ সালের এইচএসসি সাপ্লিমেন্টারি পরীক্ষায় অংশগ্রহণকারী শিক্ষার্থীরাও আবেদন করতে পারবে।",
                "date": "November 2026",
                "link": "https://cou.ac.bd/admission"
            },
            {
                "order": 3,
                "title_en": "Online Application Submission",
                "title_bn": "অনলাইন আবেদন কার্যক্রম",
                "description_en": "Fill out the online application form. Application is open 24/7 from 10 December to 31 December 2026, including public holidays.",
                "description_bn": "১০ ডিসেম্বর ২০২৬ থেকে ৩১ ডিসেম্বর ২০২৬ রাত ১১:৫৯ মিনিট পর্যন্ত দিনরাত যে কোনো সময় এমনকি বন্ধের দিনও অনলাইনে আবেদন করা যাবে।",
                "date": "10 Dec - 31 Dec 2026",
                "link": "https://cou.ac.bd/admission"
            },
            {
                "order": 4,
                "title_en": "Pay Application Fee",
                "title_bn": "আবেদন ফি পরিশোধ",
                "description_en": "Complete the application fee payment via mobile banking (bKash/Nagad/Rocket) or designated bank channels before deadline.",
                "description_bn": "মোবাইল ব্যাংকিং (বিকাশ/নগদ/রকেট) বা নির্ধারিত ব্যাংকের মাধ্যমে সময়সীমার মধ্যে আবেদন ফি প্রদান সম্পন্ন করুন।",
                "date": "Within 72 Hours of Application",
                "link": "https://cou.ac.bd/admission/payment"
            },
            {
                "order": 5,
                "title_en": "Download Admit Card",
                "title_bn": "প্রবেশপত্র ডাউনলোড ও প্রিন্ট",
                "description_en": "Log into your applicant account and print clear color copies of your admit card containing your roll and exam venue instructions.",
                "description_bn": "আবেদনকারী পোর্টালে লগইন করে রঙিন প্রবেশপত্র প্রিন্ট করে সংরক্ষণ করুন। এটি ছাড়া পরীক্ষার হলে প্রবেশ নিষিদ্ধ।",
                "date": "25 Nov - 03 Dec 2026",
                "link": "https://cou.ac.bd/admission/admit"
            },
            {
                "order": 6,
                "title_en": "Find Your Seat & Exam Center",
                "title_bn": "সিট প্ল্যান ও কেন্দ্র অনুসন্ধান (এই ওয়েব অ্যাপ)",
                "description_en": "Use this web application to enter your Admission Roll and view your exact center, building, room, seat number, and Google Maps route.",
                "description_bn": "এই ওয়েব অ্যাপে আপনার রোল নম্বর লিখে সার্চ করলেই আপনার পরীক্ষার কেন্দ্র, ভবন, রুম ও সরাসরি গুগল ম্যাপে রুট পেয়ে যাবেন।",
                "date": "Published 48h before exam",
                "link": "https://seat.cou.ac.bd"
            },
            {
                "order": 7,
                "title_en": "Exam Day Preparation & Checklist",
                "title_bn": "পরীক্ষার দিনের প্রস্তুতি ও চেকলিস্ট",
                "description_en": "Arrive at least 1 hour before exam start. Bring original admit card, HSC registration card, black ballpoint pens, and transparent water bottle.",
                "description_bn": "পরীক্ষার অন্তত ১ ঘণ্টা আগে কেন্দ্রে পৌঁছান। মূল প্রবেশপত্র, এইচএসসি রেজিস্ট্রেশন কার্ড, কালো বলপেন ও স্বচ্ছ পানির বোতল সাথে রাখুন।",
                "date": "Exam Day: 05 Dec 2026",
                "link": "https://cou.ac.bd/guidelines"
            },
            {
                "order": 8,
                "title_en": "Publication of Exam Results",
                "title_bn": "ভর্তি পরীক্ষার ফলাফল প্রকাশ",
                "description_en": "Exam results and scored marks will be published on the official admission portal and university notice boards.",
                "description_bn": "বিশ্ববিদ্যালয়ের ওয়েবসাইট ও নোটিশ বোর্ডে ভর্তি পরীক্ষার ফলাফল ও নম্বর প্রকাশ করা হবে।",
                "date": "12 December 2026",
                "link": "https://cou.ac.bd/admission/results"
            },
            {
                "order": 9,
                "title_en": "Merit List & Subject Choice",
                "title_bn": "মেধা তালিকা ও বিষয় পছন্দক্রম প্রদান",
                "description_en": "Qualified candidates submit subject preferences online based on merit rank and faculty quota availability.",
                "description_bn": "উত্তীর্ণ শিক্ষার্থীরা মেধা স্কোর অনুযায়ী নির্ধারিত সময়ের মধ্যে অনলাইনে বিষয় পছন্দক্রম পূরণ করবেন।",
                "date": "18 - 24 December 2026",
                "link": "https://cou.ac.bd/admission/choice"
            },
            {
                "order": 10,
                "title_en": "Document Verification & Final Admission",
                "title_bn": "কাগজপত্র যাচাই ও চূড়ান্ত ভর্তি",
                "description_en": "Selected students present original certificates and mark sheets at the registrar office and pay the semester admission fee.",
                "description_bn": "নির্বাচিত শিক্ষার্থীরা মূল সার্টিফিকেট, ট্রান্সক্রিপ্ট ও কোটা সনদসহ উপস্থিত হয়ে চূড়ান্ত ভর্তি সম্পন্ন করবেন।",
                "date": "05 - 10 January 2027",
                "link": "https://cou.ac.bd/admission/final"
            }
        ]

        AdmissionStep.objects.all().delete()
        for sdata in steps_data:
            AdmissionStep.objects.create(**sdata)
        self.stdout.write(self.style.SUCCESS(f"Seeded 10 Admission Timeline Steps."))

        # 5. 5 FAQs (Bangla & English)
        faqs_data = [
            {
                "order": 1,
                "question_en": "What documents and items must I bring to the exam hall?",
                "question_bn": "পরীক্ষার দিন কেন্দ্রে কী কী সাথে আনা বাধ্যতামূলক?",
                "answer_en": "You must bring: 1) Printed color copy of your Admit Card, 2) Original HSC Registration Card, and 3) Black ballpoint pens. Transparent clipboard and clear water bottle are allowed.",
                "answer_bn": "১) রঙিন প্রিন্টকৃত প্রবেশপত্র, ২) মূল এইচএসসি রেজিস্ট্রেশন কার্ড, এবং ৩) কালো কালির বলপয়েন্ট কলম। স্বচ্ছ রাইটিং বোর্ড ও পানির বোতল আনা যাবে।"
            },
            {
                "order": 2,
                "question_en": "Are mobile phones, calculators, or smartwatches permitted?",
                "question_bn": "পরীক্ষার হলে মোবাইল ফোন, ক্যালকুলেটর বা ডিজিটাল ঘড়ি আনা যাবে কি?",
                "answer_en": "Strictly NO. Mobile phones, programmable calculators, smart watches, Bluetooth devices, and any electronic items are completely prohibited in exam centers.",
                "answer_bn": "সম্পূর্ণভাবে নিষিদ্ধ। মোবাইল ফোন, ক্যালকুলেটর, স্মার্টওয়াচ, ব্লুটুথ হেডফোন বা যেকোনো ইলেকট্রনিক ডিভাইস কেন্দ্রে নিয়ে আসা শাস্তিযোগ্য অপরাধ।"
            },
            {
                "order": 3,
                "question_en": "What is the reporting time and when will the entry gates close?",
                "question_bn": "পরীক্ষার হলে উপস্থিতির সময় এবং গেট বন্ধ হওয়ার নিয়ম কী?",
                "answer_en": "Reporting time is 09:00 AM (1 hour before the exam starts at 10:00 AM). Main gates close strictly 15 minutes before the exam begins.",
                "answer_bn": "রিপোর্টিং সময় সকাল ৯:০০ টা (পরীক্ষা শুরু সকাল ১০:০০ টা)। পরীক্ষা শুরুর ১৫ মিনিট পূর্বে কেন্দ্রের সকল গেট বন্ধ করে দেওয়া হবে।"
            },
            {
                "order": 4,
                "question_en": "How can I travel to the Comilla University Kotbari campus?",
                "question_bn": "কুমিল্লা বিশ্ববিদ্যালয় কোটবাড়ি ক্যাম্পাসে যাওয়ার যাতায়াত ব্যবস্থা কেমন?",
                "answer_en": "From Comilla Kandirpar or Paduar Bazar Bishwa Road, auto-rickshaws, CNGs, and university special shuttle buses are available directly to Kotbari CoU Campus Gate 1.",
                "answer_bn": "কুমিল্লা কান্দিরপাড় বা পদুয়ার বাজার বিশ্বরোড থেকে কোটবাড়িগামী অটো/সিএনজি এবং বিশ্ববিদ্যালয়ের বিশেষ শাটল বাস সরাসরি ক্যাম্পাসের ১ নং গেটে যায়।"
            },
            {
                "order": 5,
                "question_en": "What should I do if my Admission Roll is not found in the seat plan?",
                "question_bn": "সিট প্ল্যানে রোল নম্বর পাওয়া না গেলে কী করব?",
                "answer_en": "First double-check your roll on your admit card. If still not found, contact the admission helpdesk hotline at +880 1711-223344 or visit the Central Help Desk at Campus Gate 1.",
                "answer_bn": "প্রথমে প্রবেশপত্রের সাথে রোল নম্বরটি মিলিয়ে দেখুন। কোনো সমস্যা হলে আমাদের হেল্পলাইন +880 1711-223344 নম্বরে কল করুন অথবা ১ নং গেটের সেন্ট্রাল হেল্পডেস্কে যোগাযোগ করুন।"
            }
        ]

        FAQ.objects.all().delete()
        for fdata in faqs_data:
            FAQ.objects.create(**fdata)
        self.stdout.write(self.style.SUCCESS(f"Seeded 5 Admission FAQs."))

        # 6. Official Notices (Bangla & English)
        notices_data = [
            {
                "title_bn": "কুমিল্লা বিশ্ববিদ্যালয়ের ভর্তি পরীক্ষার আবেদন শুরু ১০ ডিসেম্বর (২০২৬-২৭ শিক্ষাবর্ষ)",
                "title_en": "Comilla University Admission 2026-27: Application Starts 10 December",
                "body_bn": "কুমিল্লা বিশ্ববিদ্যালয়ের স্নাতক (সম্মান) প্রথম বর্ষ (২০২৬-২৭ শিক্ষাবর্ষ) ভর্তি পরীক্ষার আবেদন আগামী ১০ ডিসেম্বর ২০২৬ তারিখ থেকে শুরু হবে এবং ৩১ ডিসেম্বর ২০২৬ তারিখ পর্যন্ত দিনরাত যে কোনো সময় এমনকি বন্ধের দিনও আবেদন করা যাবে। উপাচার্য প্রফেসর ড. এম এম শরীফুল করীম'র সভাপতিত্বে কেন্দ্রীয় ভর্তি কমিটির সভায় এ সিদ্ধান্ত গ্রহণ করা হয়।\n\nউল্লেখ্য, যেসকল শিক্ষার্থী ২০২৬ সালের এইচএসসি সাপ্লিমেন্টারি পরীক্ষায় অংশগ্রহণ করবে তারাও আবেদন করতে পারবে। পূর্বে ঘোষিত ভর্তি পরীক্ষার তারিখ অপরিবর্তিত থাকবে। বিস্তারিত তথ্য www.cou.ac.bd এবং বিশ্ববিদ্যালয়ের অফিশিয়াল পেইজে বিজ্ঞপ্তি প্রকাশের মাধ্যমে জানানো হবে।\n\n(স্মারক: কু:বি:/তথ্য ও জন./প্রে.বি/২০০৯/৮৮৫, তারিখ: ১১/১১/২০২৬ খ্রি.)",
                "body_en": "Application for Comilla University Undergraduate 1st Year (2026-27 Academic Session) will commence on 10 December 2026 and continue until 31 December 2026 (open 24/7, including holidays). The decision was taken in the Central Admission Committee meeting chaired by Vice-Chancellor Prof. Dr. M. M. Shariful Karim.\n\nNotably, students appearing for the 2026 HSC Supplementary Examinations are also eligible to apply. Previously announced examination schedules remain unchanged. Detailed circular will be available at www.cou.ac.bd and the university official verified Facebook page.\n\n(Memo: CoU/Info & PR/Press Rel/2009/885, Date: 11 Nov 2026)",
                "is_pinned": True
            },
            {
                "title_en": "Exam Day Transport & Special Bus Shuttle Service",
                "title_bn": "ভর্তি পরীক্ষার দিন কেন্দ্রের নির্দেশনা ও বিশেষ পরিবহন সেবা",
                "body_en": "On exam day, special university shuttle buses will run every 10 minutes between Comilla Railway Station, Sasongachha Bus Terminal, Paduar Bazar, and Comilla University Campus. Candidates are advised to arrive early.",
                "body_bn": "ভর্তি পরীক্ষা উপলক্ষে সকাল ৭:০০ টা থেকে কুমিল্লা রেলওয়ে স্টেশন, শাসনগাছা টার্মিনাল ও পদুয়ার বাজার থেকে বিশ্ববিদ্যালয় ক্যাম্পাসে প্রতি ১০ মিনিট পর পর বিশেষ শাটল বাস চলাচল করবে। সকল পরীক্ষার্থীকে পর্যাপ্ত সময় হাতে নিয়ে রওয়ানা হওয়ার অনুরোধ করা হচ্ছে।",
                "is_pinned": False
            }
        ]

        Notice.objects.all().delete()
        for ndata in notices_data:
            Notice.objects.create(**ndata)
        self.stdout.write(self.style.SUCCESS(f"Seeded 2 Official Notices."))

        self.stdout.write(self.style.SUCCESS("\nDemo data seeding completed successfully!"))


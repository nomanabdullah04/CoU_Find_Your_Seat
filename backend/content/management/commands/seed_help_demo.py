from django.core.management.base import BaseCommand
from content.models import Association, Contact, HelpSettings

class Command(BaseCommand):
    help = 'Seeds demo data for Help & Associations with fake contact numbers (01XXX-XXXXXX)'

    def handle(self, *args, **options):
        self.stdout.write("Seeding Help Settings & Emergency Numbers...")

        # 1. Primary and Emergency Helplines
        HelpSettings.objects.all().delete()
        helplines_data = [
            {
                "label_bn": "কেন্দ্রীয় ভর্তি হেল্পডেস্ক (প্রধান)",
                "label_en": "Central Admission Helpline (Primary)",
                "phone": "+880 1711-223344",
                "is_primary": True,
                "order": 1,
            },
            {
                "label_bn": "প্রক্টর অফিস (জরুরি নিরাপত্তা ও সহায়তা)",
                "label_en": "Proctor Office (Emergency Security)",
                "phone": "01711-000111",
                "is_primary": False,
                "order": 2,
            },
            {
                "label_bn": "বিশ্ববিদ্যালয় মেডিকেল সেন্টার (জরুরি চিকিৎসা)",
                "label_en": "University Medical Center (First Aid)",
                "phone": "01711-000222",
                "is_primary": False,
                "order": 3,
            },
            {
                "label_bn": "জাতীয় জরুরি সেবা (পুলিশ / অ্যাম্বুলেন্স / ফায়ার)",
                "label_en": "National Emergency Service (Police/Ambulance)",
                "phone": "999",
                "is_primary": False,
                "order": 4,
            },
        ]

        for item in helplines_data:
            HelpSettings.objects.create(**item)

        self.stdout.write(f"Created {len(helplines_data)} Help Settings / Emergency numbers.")

        # 2. 5 Demo District & Division Student Associations
        self.stdout.write("Seeding Student Associations and Contacts...")
        Association.objects.all().delete()

        associations_data = [
            {
                "name_bn": "ঢাকা বিভাগীয় ছাত্র কল্যাণ পরিষদ",
                "name_en": "Dhaka Division Students' Association",
                "type": "division",
                "order": 1,
                "contacts": [
                    {
                        "role": "secretary",
                        "name": "তানভীর আহমেদ (Tanvir Ahmed)",
                        "phone": "01711-123456",
                        "whatsapp": "01711123456",
                        "available_time": "8:00 AM - 10:00 PM",
                    },
                    {
                        "role": "general_secretary",
                        "name": "সাদিয়া আফরিন (Sadia Afrin)",
                        "phone": "01711-123457",
                        "whatsapp": "01711123457",
                        "available_time": "9:00 AM - 9:00 PM",
                    },
                ]
            },
            {
                "name_bn": "চট্টগ্রাম বিভাগীয় শিক্ষার্থী ফোরাম",
                "name_en": "Chittagong Division Student Forum",
                "type": "division",
                "order": 2,
                "contacts": [
                    {
                        "role": "secretary",
                        "name": "মোহাম্মদ ফাহিম (Mohammad Fahim)",
                        "phone": "01811-234567",
                        "whatsapp": "01811234567",
                        "available_time": "8:00 AM - 11:00 PM",
                    },
                    {
                        "role": "general_secretary",
                        "name": "নুসরাত জাহান (Nusrat Jahan)",
                        "phone": "01811-234568",
                        "whatsapp": "01811234568",
                        "available_time": "8:00 AM - 10:00 PM",
                    },
                ]
            },
            {
                "name_bn": "সিলেট জেলা ছাত্র কল্যাণ সমিতি",
                "name_en": "Sylhet District Students' Welfare Society",
                "type": "district",
                "order": 3,
                "contacts": [
                    {
                        "role": "secretary",
                        "name": "শাহরিয়ার হাসান (Shahriar Hasan)",
                        "phone": "01711-345678",
                        "whatsapp": "01711345678",
                        "available_time": "8:00 AM - 10:00 PM",
                    },
                    {
                        "role": "general_secretary",
                        "name": "তাহমিনা আক্তার (Tahmina Akter)",
                        "phone": "01711-345679",
                        "whatsapp": "01711345679",
                        "available_time": "9:00 AM - 9:00 PM",
                    },
                ]
            },
            {
                "name_bn": "উত্তরবঙ্গ (রাজশাহী ও রংপুর) ছাত্র ঐক্য পরিষদ",
                "name_en": "North Bengal (Rajshahi & Rangpur) Student Council",
                "type": "division",
                "order": 4,
                "contacts": [
                    {
                        "role": "secretary",
                        "name": "আরিফুর রহমান (Arifur Rahman)",
                        "phone": "01711-456789",
                        "whatsapp": "01711456789",
                        "available_time": "8:30 AM - 10:30 PM",
                    },
                    {
                        "role": "general_secretary",
                        "name": "সুমাইয়া খাতুন (Sumaiya Khatun)",
                        "phone": "01711-456780",
                        "whatsapp": "01711456780",
                        "available_time": "8:00 AM - 10:00 PM",
                    },
                ]
            },
            {
                "name_bn": "বরিশাল জেলা ছাত্র কল্যাণ পরিষদ",
                "name_en": "Barisal District Student Kalyan Parishad",
                "type": "district",
                "order": 5,
                "contacts": [
                    {
                        "role": "secretary",
                        "name": "মেহেদী হাসান (Mehedi Hasan)",
                        "phone": "01911-567890",
                        "whatsapp": "01911567890",
                        "available_time": "8:00 AM - 10:00 PM",
                    },
                    {
                        "role": "general_secretary",
                        "name": "ফারহানা ইসলাম (Farhana Islam)",
                        "phone": "01911-567891",
                        "whatsapp": "01911567891",
                        "available_time": "9:00 AM - 9:00 PM",
                    },
                ]
            },
        ]

        total_contacts = 0
        for assoc_data in associations_data:
            contacts_list = assoc_data.pop("contacts")
            association = Association.objects.create(**assoc_data, is_active=True)
            for c in contacts_list:
                Contact.objects.create(
                    association=association,
                    role=c["role"],
                    name=c["name"],
                    phone=c["phone"],
                    whatsapp=c.get("whatsapp"),
                    available_time=c.get("available_time", "8:00 AM - 10:00 PM"),
                    is_visible=True,
                )
                total_contacts += 1

        self.stdout.write(self.style.SUCCESS(
            f"Successfully seeded {len(associations_data)} associations with {total_contacts} contacts and {len(helplines_data)} helplines!"
        ))


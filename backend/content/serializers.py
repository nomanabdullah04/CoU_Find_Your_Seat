from rest_framework import serializers
from .models import Notice, AdmissionStep, FAQ, Association, Contact, HelpSettings

class NoticeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notice
        fields = '__all__'


class AdmissionStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdmissionStep
        fields = '__all__'


class FAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = '__all__'


# Help & Associations Serializers

class ContactSerializer(serializers.ModelSerializer):
    association_name = serializers.CharField(source='association.name_en', read_only=True)

    class Meta:
        model = Contact
        fields = '__all__'


class PublicContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = ['id', 'role', 'name', 'phone', 'whatsapp', 'available_time']


class AssociationSerializer(serializers.ModelSerializer):
    contacts_count = serializers.IntegerField(source='contacts.count', read_only=True)

    class Meta:
        model = Association
        fields = '__all__'


class PublicAssociationSerializer(serializers.ModelSerializer):
    contacts = serializers.SerializerMethodField()

    class Meta:
        model = Association
        fields = ['id', 'name_bn', 'name_en', 'type', 'order', 'contacts']

    def get_contacts(self, obj):
        visible_contacts = obj.contacts.filter(is_visible=True)
        return PublicContactSerializer(visible_contacts, many=True).data


class HelpSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = HelpSettings
        fields = '__all__'

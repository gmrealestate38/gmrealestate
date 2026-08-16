from rest_framework import serializers

from .models import ContactLog, Property, PropertyImage, SavedProperty
from .utils import get_agent_phone_for_town


class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ['id', 'image']


class PropertySerializer(serializers.ModelSerializer):
    """
    Listings grid aur property detail page dono ke liye use hoti hai.
    `images` read-only nested list hai; naye images upload karne ke
    liye alag se multipart request bhejni hogi (neeche view mein
    dekhein) taake file uploads sahi tarah handle ho sakein.
    """

    images = PropertyImageSerializer(many=True, read_only=True)
    agent_phone = serializers.SerializerMethodField()
    posted_by_email = serializers.EmailField(source='posted_by.email', read_only=True)

    class Meta:
        model = Property
        fields = [
            'id', 'title', 'property_type', 'purpose',
            'city', 'district', 'town', 'exact_address', 'landmark',
            'price', 'advance',
            'area_size', 'area_unit', 'bedrooms', 'bathrooms',
            'furnishing', 'facing', 'condition', 'description',
            'owner_contact', 'posted_by_email',
            'status', 'sale_rating', 'sale_feedback', 'sold_at',
            'created_at', 'updated_at',
            'images', 'agent_phone',
        ]
        read_only_fields = ['id', 'status', 'sold_at', 'created_at', 'updated_at']

    def get_agent_phone(self, obj):
        return get_agent_phone_for_town(obj.town)


class MarkSoldSerializer(serializers.Serializer):
    """POST body jab agent property ko 'Mark as Sold' karta hai."""

    rating = serializers.IntegerField(min_value=1, max_value=5, required=False)
    feedback = serializers.CharField(required=False, allow_blank=True)


class ContactLogSerializer(serializers.ModelSerializer):
    property_title = serializers.CharField(source='property.title', read_only=True)
    town = serializers.CharField(source='property.town', read_only=True)

    class Meta:
        model = ContactLog
        fields = ['id', 'property', 'property_title', 'town', 'agent_phone', 'contacted_at']
        read_only_fields = ['id', 'agent_phone', 'contacted_at', 'property_title', 'town']


class SavedPropertySerializer(serializers.ModelSerializer):
    property_detail = PropertySerializer(source='property', read_only=True)

    class Meta:
        model = SavedProperty
        fields = ['id', 'property', 'property_detail', 'saved_at']
        read_only_fields = ['id', 'saved_at', 'property_detail']
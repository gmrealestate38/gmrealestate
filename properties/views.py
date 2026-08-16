from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import ContactLog, Property, PropertyImage, SavedProperty
from .permissions import IsAgent, IsOwnerOrReadOnly
from .serializers import (
    ContactLogSerializer,
    MarkSoldSerializer,
    PropertySerializer,
    SavedPropertySerializer,
)
from .utils import get_agent_phone_for_town, types_for_category


class PropertyViewSet(viewsets.ModelViewSet):
    """
    /api/properties/properties/
    Frontend ke updatePublicListings() ka server-side equivalent --
    query params se filter hota hai:

      ?purpose=Sale|Rent|Installments
      ?category=House|Plot|Flat|Commercial|Guest House|Hut / Farm House
      ?city=Karachi
      ?district=Karachi East          (substring match)
      ?town=Gulshan-e-Iqbal            (substring match)
      ?min_price=100000&max_price=500000
    """

    queryset = Property.objects.all()
    serializer_class = PropertySerializer
    permission_classes = [IsOwnerOrReadOnly]

    def get_permissions(self):
        if self.action == 'create':
            return [IsAgent()]
        return super().get_permissions()

    def get_queryset(self):
        qs = Property.objects.all()
        params = self.request.query_params

        category = params.get('category')
        if category:
            qs = qs.filter(property_type__in=types_for_category(category))

        purpose = params.get('purpose')
        if purpose:
            qs = qs.filter(purpose=purpose)

        city = params.get('city')
        if city:
            qs = qs.filter(city=city)

        district = params.get('district')
        if district:
            qs = qs.filter(district__icontains=district)

        town = params.get('town')
        if town:
            qs = qs.filter(town__icontains=town)

        min_price = params.get('min_price')
        if min_price:
            qs = qs.filter(price__gte=min_price)

        max_price = params.get('max_price')
        if max_price:
            qs = qs.filter(price__lte=max_price)

        return qs

    def perform_create(self, serializer):
        property_obj = serializer.save(posted_by=self.request.user)
        self._save_uploaded_images(property_obj)

    def perform_update(self, serializer):
        property_obj = serializer.save()
        # Agar naye images bheji gayi hain to purani hata kar naye laga dein
        # (form.js ka "agar file select ki to replace karo, warna purani
        # rehne do" wala rule yahan bhi follow hota hai)
        if self.request.FILES.getlist('images'):
            property_obj.images.all().delete()
            self._save_uploaded_images(property_obj)

    def _save_uploaded_images(self, property_obj):
        for image_file in self.request.FILES.getlist('images'):
            PropertyImage.objects.create(property=property_obj, image=image_file)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_listings(self, request):
        """GET /api/properties/properties/my_listings/ -- Agent ki apni properties (my-listings.html)."""
        qs = Property.objects.filter(posted_by=request.user)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsOwnerOrReadOnly])
    def mark_sold(self, request, pk=None):
        """POST /api/properties/properties/{id}/mark_sold/ -- feedbackModal submit/skip ka equivalent."""
        property_obj = self.get_object()
        serializer = MarkSoldSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        property_obj.status = 'Sold'
        property_obj.sale_rating = serializer.validated_data.get('rating')
        property_obj.sale_feedback = serializer.validated_data.get('feedback', '')
        property_obj.sold_at = timezone.now()
        property_obj.save()

        return Response(PropertySerializer(property_obj).data)

    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def contact(self, request, pk=None):
        """
        POST /api/properties/properties/{id}/contact/ -- jab buyer
        "Contact Agent"/WhatsApp/Call dabaye. Agent ka number wapis
        karta hai aur owner-dashboard.html ke liye log bhi karta hai.
        """
        property_obj = self.get_object()
        agent_phone = get_agent_phone_for_town(property_obj.town)

        ContactLog.objects.create(property=property_obj, agent_phone=agent_phone)

        return Response({'agent_phone': agent_phone})


class ContactLogListView(generics.ListAPIView):
    """GET /api/properties/contact-logs/ -- Owner Dashboard ke liye poora log."""

    queryset = ContactLog.objects.all()
    serializer_class = ContactLogSerializer
    permission_classes = [IsAuthenticated]  # Chahen to isay IsAdminUser bhi bana sakte hain


class SavedPropertyListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/properties/saved/  -- current user ki saari saved properties
    POST /api/properties/saved/  -- {"property": <id>} bhej kar save karein
    """

    serializer_class = SavedPropertySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SavedProperty.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SavedPropertyDeleteView(generics.DestroyAPIView):
    """DELETE /api/properties/saved/{property_id}/ -- Unsave karne ke liye."""

    permission_classes = [IsAuthenticated]
    serializer_class = SavedPropertySerializer

    def get_object(self):
        return get_object_or_404(
            SavedProperty, user=self.request.user, property_id=self.kwargs['property_id']
        )
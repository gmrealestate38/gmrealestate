from django.conf import settings
from django.db import models


class Property(models.Model):
    """
    Ek property listing -- frontend ke form.html se collect hone wale
    saare fields yahan match karte hain.
    """

    PURPOSE_CHOICES = [
        ('Sale', 'For Sale'),
        ('Rent', 'For Rent'),
        ('Installments', 'Installments Plan'),
    ]
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Sold', 'Sold'),
    ]

    # Basic Details
    title = models.CharField(max_length=200)
    property_type = models.CharField(max_length=50)  # House, Flat, Plot, Shop, Godown / Warehouse, etc.
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES)

    # Location
    city = models.CharField(max_length=50, default='Karachi')
    district = models.CharField(max_length=100)
    town = models.CharField(max_length=100)
    exact_address = models.CharField(max_length=255)
    landmark = models.CharField(max_length=255, blank=True)

    # Pricing (Sale/Installments use `price`; Rent uses `price` for
    # monthly rent + `advance` separately -- matches form.js logic)
    price = models.BigIntegerField()
    advance = models.BigIntegerField(null=True, blank=True)

    # Specifications
    area_size = models.PositiveIntegerField()
    area_unit = models.CharField(max_length=20, default='Sq. Yds')
    bedrooms = models.PositiveIntegerField(null=True, blank=True)
    bathrooms = models.PositiveIntegerField(null=True, blank=True)
    furnishing = models.CharField(max_length=30, blank=True)
    facing = models.CharField(max_length=30, blank=True)
    condition = models.CharField(max_length=30, blank=True)
    description = models.TextField(blank=True)

    # Owner / contact
    owner_contact = models.CharField(max_length=20)
    posted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='properties'
    )

    # Status + "Mark as Sold" feedback
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Active')
    sale_rating = models.PositiveSmallIntegerField(null=True, blank=True)
    sale_feedback = models.TextField(blank=True)
    sold_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class PropertyImage(models.Model):
    """Har property ki multiple images ho sakti hain."""

    property = models.ForeignKey(Property, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='property_images/%Y/%m/')

    def __str__(self):
        return f"Image for {self.property.title}"


class ContactLog(models.Model):
    """
    Owner Dashboard ke liye: jab bhi koi buyer/tenant 'Contact Agent'
    ya WhatsApp/Call button dabata hai, ek entry yahan save hoti hai.
    """

    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='contact_logs')
    agent_phone = models.CharField(max_length=20)
    contacted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-contacted_at']

    def __str__(self):
        return f"{self.property.title} @ {self.contacted_at}"


class SavedProperty(models.Model):
    """User ne kaunsi properties ❤️ Save ki hain."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='saved_properties'
    )
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='saved_by')
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'property')

    def __str__(self):
        return f"{self.user} saved {self.property}"
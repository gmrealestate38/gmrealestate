from datetime import timedelta

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class Zone(models.Model):
    """
    GM Real Estate ke 4 zones.
    """

    NORTH = 'NORTH'
    SOUTH = 'SOUTH'
    EAST = 'EAST'
    WEST = 'WEST'

    ZONE_CHOICES = [
        (NORTH, 'North'),
        (SOUTH, 'South'),
        (EAST, 'East'),
        (WEST, 'West'),
    ]

    code = models.CharField(
        max_length=10,
        choices=ZONE_CHOICES,
        unique=True
    )

    name = models.CharField(
        max_length=50,
        unique=True
    )

    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class Profile(models.Model):
    """
    Django ke built-in User model ke sath extra information.
    Role: User ya Agent.
    Har profile ko ek zone assign kiya ja sakta hai.
    """

    ROLE_CHOICES = [
        ('User', 'User'),
        ('Agent', 'Agent'),
    ]

    ADMIN_ROLE_CHOICES = [
        ('None', 'Normal User/Agent'),
        ('ZoneAdmin', 'Zone Admin'),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )

    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES
    )

    phone = models.CharField(max_length=20)

    # ---------------------------------
    # Zone Management
    # ---------------------------------

    zone = models.ForeignKey(
        Zone,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='profiles'
    )

    admin_role = models.CharField(
        max_length=20,
        choices=ADMIN_ROLE_CHOICES,
        default='None'
    )

    # --- User-specific fields ---

    preferred_city = models.CharField(
        max_length=50,
        blank=True,
        default='Karachi'
    )

    # --- Agent-specific fields ---

    agency_name = models.CharField(
        max_length=150,
        blank=True
    )

    cnic = models.CharField(
        max_length=20,
        blank=True
    )

    town = models.CharField(
        max_length=100,
        blank=True
    )

    experience_years = models.PositiveIntegerField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} ({self.role})"


class EmailOTP(models.Model):
    """
    Email par bheja gaya 6-digit verification code.
    Signup aur Forgot Password dono ke liye use hota hai.
    """

    PURPOSE_CHOICES = [
        ('signup', 'Signup Verification'),
        ('reset', 'Password Reset'),
    ]

    email = models.EmailField()

    code = models.CharField(
        max_length=6
    )

    purpose = models.CharField(
        max_length=10,
        choices=PURPOSE_CHOICES
    )

    is_used = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=10)

    def __str__(self):
        return f"{self.email} - {self.purpose} - {self.code}"
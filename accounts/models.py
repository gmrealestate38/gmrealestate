from datetime import timedelta

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class Profile(models.Model):
    """
    Django ke built-in User model (username, email, password) ke sath
    yeh extra fields judte hain -- role (User ya Agent) aur har role
    ke apne specific fields (frontend ke login.html signup forms se
    match karta hai).
    """

    ROLE_CHOICES = [
        ('User', 'User'),
        ('Agent', 'Agent'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    phone = models.CharField(max_length=20)

    # --- User-specific fields ---
    preferred_city = models.CharField(max_length=50, blank=True, default='Karachi')

    # --- Agent-specific fields ---
    agency_name = models.CharField(max_length=150, blank=True)
    cnic = models.CharField(max_length=20, blank=True)
    town = models.CharField(max_length=100, blank=True)
    experience_years = models.PositiveIntegerField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} ({self.role})"


class EmailOTP(models.Model):
    """
    Email par bheja gaya 6-digit verification code -- Signup ke waqt
    (purpose='signup') aur Forgot Password ke waqt (purpose='reset')
    dono ke liye use hota hai.
    """

    PURPOSE_CHOICES = [
        ('signup', 'Signup Verification'),
        ('reset', 'Password Reset'),
    ]

    email = models.EmailField()
    code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=10, choices=PURPOSE_CHOICES)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        # Code sirf 10 minute ke liye valid hai
        return timezone.now() > self.created_at + timedelta(minutes=10)

    def __str__(self):
        return f"{self.email} - {self.purpose} - {self.code}"
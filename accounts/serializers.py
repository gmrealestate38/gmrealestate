from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import EmailOTP, Profile


class ProfileSerializer(serializers.ModelSerializer):
    """Login/'me' response mein current user ki info bhejne ke liye."""

    name = serializers.CharField(source='user.get_full_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Profile
        fields = [
            'name', 'email', 'role', 'phone', 'preferred_city',
            'agency_name', 'cnic', 'town', 'experience_years',
        ]


# =========================================================
# REGISTRATION -- account "is_active=False" ban ke create hota hai,
# OTP verify hone ke baad hi "is_active=True" hota hai (neeche
# VerifyOTPSerializer). Is beech agar wohi email dobara register
# karne ki koshish kare, to purana ADHOORA (unverified) account
# hata kar naya bana dete hain -- taake user phans na jaye.
# =========================================================

def _remove_stale_unverified_account(email):
    """Agar isi email ka pehle se ek UNVERIFIED account pada hai, usay hata dete hain."""
    User.objects.filter(email__iexact=email, is_active=False).delete()


class UserRegisterSerializer(serializers.Serializer):
    """POST /api/accounts/register/user/ -- role='User'."""

    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    city = serializers.CharField(max_length=50, required=False, default='Karachi')
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True, label='Confirm Password')

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value, is_active=True).exists():
            raise serializers.ValidationError('Is email se account pehle se maujood hai. Login karein.')
        return value

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password2': 'Password aur Confirm Password match nahi kar rahe.'})
        validate_password(data['password'])
        return data

    def create(self, validated_data):
        _remove_stale_unverified_account(validated_data['email'])

        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['name'],
            is_active=False,  # OTP verify hone tak inactive
        )
        profile = Profile.objects.create(
            user=user,
            role='User',
            phone=validated_data['phone'],
            preferred_city=validated_data.get('city', 'Karachi'),
        )
        return profile


class AgentRegisterSerializer(serializers.Serializer):
    """POST /api/accounts/register/agent/ -- role='Agent'."""

    name = serializers.CharField(max_length=150)
    agency = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    cnic = serializers.CharField(max_length=20)
    town = serializers.CharField(max_length=100)
    experience = serializers.IntegerField(required=False, allow_null=True)
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True, label='Confirm Password')

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value, is_active=True).exists():
            raise serializers.ValidationError('Is email se account pehle se maujood hai. Login karein.')
        return value

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password2': 'Password aur Confirm Password match nahi kar rahe.'})
        validate_password(data['password'])
        return data

    def create(self, validated_data):
        _remove_stale_unverified_account(validated_data['email'])

        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['name'],
            is_active=False,
        )
        profile = Profile.objects.create(
            user=user,
            role='Agent',
            phone=validated_data['phone'],
            agency_name=validated_data['agency'],
            cnic=validated_data['cnic'],
            town=validated_data['town'],
            experience_years=validated_data.get('experience'),
        )
        return profile


# =========================================================
# OTP: send / resend / verify
# =========================================================

class SendOTPSerializer(serializers.Serializer):
    """
    POST /api/accounts/resend-otp/  --  {email, purpose: 'signup'|'reset'}
    'signup' ke liye: email ka ek PENDING (is_active=False) account hona
    zaroori hai (yani pehle register/ call ho chuki ho).
    'reset' ke liye: email ka VERIFIED (is_active=True) account hona zaroori hai.
    """

    email = serializers.EmailField()
    purpose = serializers.ChoiceField(choices=['signup', 'reset'])

    def validate(self, data):
        email = data['email']
        purpose = data['purpose']

        if purpose == 'signup':
            if not User.objects.filter(email__iexact=email, is_active=False).exists():
                raise serializers.ValidationError(
                    {'email': 'Pehle registration form submit karein, phir code bheja jayega.'}
                )
        else:  # reset
            if not User.objects.filter(email__iexact=email, is_active=True).exists():
                raise serializers.ValidationError({'email': 'Is email se koi verified account maujood nahi hai.'})

        return data


class VerifyOTPSerializer(serializers.Serializer):
    """POST /api/accounts/verify-otp/  --  {email, otp_code}. Account ko activate karta hai."""

    email = serializers.EmailField()
    otp_code = serializers.CharField(max_length=6)

    def validate(self, data):
        email = data['email']
        code = data['otp_code']

        try:
            user = User.objects.get(email__iexact=email, is_active=False)
        except User.DoesNotExist:
            raise serializers.ValidationError({'email': 'Koi pending registration nahi mila is email ke liye.'})

        otp = (
            EmailOTP.objects.filter(email__iexact=email, purpose='signup', is_used=False)
            .order_by('-created_at')
            .first()
        )

        if not otp or otp.code != str(code) or otp.is_expired():
            raise serializers.ValidationError({'otp_code': 'Code ghalat hai ya expire ho chuka hai.'})

        data['user'] = user
        data['otp'] = otp
        return data

    def save(self):
        user = self.validated_data['user']
        otp = self.validated_data['otp']

        user.is_active = True
        user.save()

        otp.is_used = True
        otp.save()

        return user


# =========================================================
# LOGIN
# =========================================================

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


# =========================================================
# FORGOT PASSWORD
# =========================================================

class ResetPasswordSerializer(serializers.Serializer):
    """POST /api/accounts/reset-password/ -- {email, otp_code, new_password, new_password2}"""

    email = serializers.EmailField()
    otp_code = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True)
    new_password2 = serializers.CharField(write_only=True, label='Confirm New Password')

    def validate(self, data):
        if data['new_password'] != data['new_password2']:
            raise serializers.ValidationError({'new_password2': 'Naya password match nahi kar raha.'})

        try:
            user = User.objects.get(email__iexact=data['email'], is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError({'email': 'Is email se koi verified account maujood nahi hai.'})

        otp = (
            EmailOTP.objects.filter(email__iexact=data['email'], purpose='reset', is_used=False)
            .order_by('-created_at')
            .first()
        )
        if not otp or otp.code != data['otp_code'] or otp.is_expired():
            raise serializers.ValidationError({'otp_code': 'Code ghalat hai ya expire ho chuka hai.'})

        validate_password(data['new_password'], user=user)

        data['user'] = user
        data['otp'] = otp
        return data

    def save(self):
        user = self.validated_data['user']
        otp = self.validated_data['otp']

        user.set_password(self.validated_data['new_password'])
        user.save()

        otp.is_used = True
        otp.save()

        return user

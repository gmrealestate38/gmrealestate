from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import EmailOTP
from .serializers import (
    AgentRegisterSerializer,
    LoginSerializer,
    ProfileSerializer,
    ResetPasswordSerializer,
    SendOTPSerializer,
    UserRegisterSerializer,
    VerifyOTPSerializer,
)
from .utils import generate_otp_code, send_otp_email

RESEND_COOLDOWN_SECONDS = 60


def _create_and_send_otp(email, purpose):
    """
    Naya OTP banata hai aur email karta hai. Agar 60 second se kam
    waqt pehle isi email+purpose ke liye code bheja gaya tha, to
    server-side bhi block kar deta hai (sirf frontend ka 60-second
    countdown hi kaafi nahi -- koi user seedha API bhi call kar sakta hai).
    """
    recent_otp = (
        EmailOTP.objects.filter(email__iexact=email, purpose=purpose)
        .order_by('-created_at')
        .first()
    )
    if recent_otp:
        seconds_since = (timezone.now() - recent_otp.created_at).total_seconds()
        if seconds_since < RESEND_COOLDOWN_SECONDS:
            wait_more = int(RESEND_COOLDOWN_SECONDS - seconds_since)
            raise ValueError(f'Baraye meharbani {wait_more} second aur intezaar karein, phir dobara code mangwayein.')

    code = generate_otp_code()
    EmailOTP.objects.create(email=email, code=code, purpose=purpose)
    send_otp_email(email, code, purpose)


class UserRegisterView(APIView):
    """
    POST /api/accounts/register/user/
    Account "is_active=False" ban ke create hota hai + OTP email hoti hai.
    Verify hone tak login nahi ho sakta.
    """

    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()

        try:
            _create_and_send_otp(profile.user.email, 'signup')
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        except Exception as exc:
            return Response(
                {'detail': f'Code bhejne mein masla hua: {exc}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {'detail': 'Registration ho gayi. Verification code aapki email par bheja gaya hai.'},
            status=status.HTTP_201_CREATED,
        )


class AgentRegisterView(APIView):
    """POST /api/accounts/register/agent/ -- UserRegisterView jaisa hi, role='Agent'."""

    def post(self, request):
        serializer = AgentRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()

        try:
            _create_and_send_otp(profile.user.email, 'signup')
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        except Exception as exc:
            return Response(
                {'detail': f'Code bhejne mein masla hua: {exc}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {'detail': 'Registration ho gayi. Verification code aapki email par bheja gaya hai.'},
            status=status.HTTP_201_CREATED,
        )


class VerifyOTPView(APIView):
    """POST /api/accounts/verify-otp/ -- {email, otp_code}. Account activate karta hai."""

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response({
            'detail': 'Email verify ho gayi! Ab login karein.',
            'profile': ProfileSerializer(user.profile).data,
        })


class ResendOTPView(APIView):
    """POST /api/accounts/resend-otp/ -- {email, purpose: 'signup'|'reset'}"""

    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        purpose = serializer.validated_data['purpose']

        try:
            _create_and_send_otp(email, purpose)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        except Exception as exc:
            return Response(
                {'detail': f'Code bhejne mein masla hua: {exc}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({'detail': 'Naya verification code bhej diya gaya hai.'})


class LoginView(APIView):
    """
    POST /api/accounts/login/ -- email + password.
    Agar account maujood hai lekin abhi verify nahi hua (is_active=False),
    to alag, saaf message deta hai -- generic "ghalat password" nahi.
    """

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        pending_user = User.objects.filter(email__iexact=email, is_active=False).first()
        if pending_user is not None:
            return Response(
                {'detail': 'Aapki email abhi verify nahi hui. Baraye meharbani pehle email verify karein.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        user = authenticate(request, username=email, password=password)
        if user is None:
            return Response(
                {'detail': 'Email ya password ghalat hai.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'profile': ProfileSerializer(user.profile).data})


class LogoutView(APIView):
    """POST /api/accounts/logout/ -- current token ko delete/invalidate karta hai."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        return Response({'detail': 'Logged out.'})


class MeView(APIView):
    """GET /api/accounts/me/ -- token se current logged-in user ki profile deta hai."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(ProfileSerializer(request.user.profile).data)


class ResetPasswordView(APIView):
    """POST /api/accounts/reset-password/ -- {email, otp_code, new_password, new_password2}"""

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'Password successfully change ho gaya hai. Ab login karein.'})

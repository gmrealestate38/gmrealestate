from django.urls import path

from . import views

urlpatterns = [
    path('register/user/', views.UserRegisterView.as_view(), name='register-user'),
    path('register/agent/', views.AgentRegisterView.as_view(), name='register-agent'),
    path('verify-otp/', views.VerifyOTPView.as_view(), name='verify-otp'),
    path('resend-otp/', views.ResendOTPView.as_view(), name='resend-otp'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('me/', views.MeView.as_view(), name='me'),
    path('reset-password/', views.ResetPasswordView.as_view(), name='reset-password'),
]

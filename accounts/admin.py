from django.contrib import admin

from .models import EmailOTP, Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'phone', 'town', 'agency_name', 'created_at')
    list_filter = ('role',)
    search_fields = ('user__username', 'user__email', 'phone', 'agency_name', 'cnic')


@admin.register(EmailOTP)
class EmailOTPAdmin(admin.ModelAdmin):
    list_display = ('email', 'code', 'purpose', 'is_used', 'created_at')
    list_filter = ('purpose', 'is_used')
    search_fields = ('email',)
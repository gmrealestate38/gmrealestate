from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.auth.models import User

from .models import EmailOTP, Profile, Zone


def get_admin_zone(request):
    """
    Agar logged-in user Zone Admin hai to uska zone return karta hai.

    Anonymous user / normal user ke liye None return hota hai.
    Master/Superuser ke liye bhi None return hota hai.
    """

    # Login page par request.user = AnonymousUser hota hai.
    # Isliye profile access karne se pehle authentication check zaroori hai.
    if not request.user.is_authenticated:
        return None

    # Master Admin / Superuser ke liye koi specific zone nahi.
    if request.user.is_superuser:
        return None

    try:
        profile = request.user.profile
    except Profile.DoesNotExist:
        return None

    if profile.admin_role == 'ZoneAdmin':
        return profile.zone

    return None


@admin.register(Zone)
class ZoneAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'code')

    def has_module_permission(self, request):
        # Sirf Master Admin Zones manage kar sakta hai
        return (
            request.user.is_authenticated
            and request.user.is_superuser
        )

    def has_view_permission(self, request, obj=None):
        return (
            request.user.is_authenticated
            and request.user.is_superuser
        )

    def has_add_permission(self, request):
        return (
            request.user.is_authenticated
            and request.user.is_superuser
        )

    def has_change_permission(self, request, obj=None):
        return (
            request.user.is_authenticated
            and request.user.is_superuser
        )

    def has_delete_permission(self, request, obj=None):
        return (
            request.user.is_authenticated
            and request.user.is_superuser
        )


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):

    list_display = (
        'user',
        'role',
        'admin_role',
        'zone',
        'phone',
        'town',
        'agency_name',
        'created_at',
    )

    list_filter = (
        'role',
        'admin_role',
        'zone',
    )

    search_fields = (
        'user__username',
        'user__email',
        'phone',
        'agency_name',
        'cnic',
        'town',
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request).select_related(
            'user',
            'zone',
        )

        # Anonymous user ko kuch nahi
        if not request.user.is_authenticated:
            return qs.none()

        # Master Admin ko sab kuch
        if request.user.is_superuser:
            return qs

        # Zone Admin ko sirf apne zone ke profiles
        zone = get_admin_zone(request)

        if zone:
            return qs.filter(zone=zone)

        # Normal staff user ko kuch nahi
        return qs.none()

    def has_module_permission(self, request):
        if not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        return get_admin_zone(request) is not None

    def has_view_permission(self, request, obj=None):
        if not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        zone = get_admin_zone(request)

        if not zone:
            return False

        if obj is None:
            return True

        return obj.zone_id == zone.id

    def has_change_permission(self, request, obj=None):
        if not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        zone = get_admin_zone(request)

        if not zone:
            return False

        if obj is None:
            return True

        return obj.zone_id == zone.id

    def has_delete_permission(self, request, obj=None):
        if not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        zone = get_admin_zone(request)

        if not zone:
            return False

        if obj is None:
            return True

        return obj.zone_id == zone.id

    def has_add_permission(self, request):
        if not request.user.is_authenticated:
            return False

        # Master Admin aur Zone Admin dono profiles add kar sakte hain
        return (
            request.user.is_superuser
            or get_admin_zone(request) is not None
        )

    def save_model(self, request, obj, form, change):
        """
        Zone Admin apne zone se bahar profile assign nahi kar sakta.
        """

        zone = get_admin_zone(request)

        if not request.user.is_superuser and zone:
            obj.zone = zone

        super().save_model(request, obj, form, change)


@admin.register(EmailOTP)
class EmailOTPAdmin(admin.ModelAdmin):

    list_display = (
        'email',
        'code',
        'purpose',
        'is_used',
        'created_at',
    )

    list_filter = (
        'purpose',
        'is_used',
    )

    search_fields = (
        'email',
    )


class ProfileInline(admin.StackedInline):
    model = Profile
    extra = 0
    max_num = 1


class CustomUserAdmin(DjangoUserAdmin):
    """
    Django User admin ko zone-aware banata hai.
    """

    inlines = (ProfileInline,)

    def get_queryset(self, request):
        qs = super().get_queryset(request).select_related(
            'profile__zone'
        )

        # Anonymous user ko kuch nahi
        if not request.user.is_authenticated:
            return qs.none()

        # Master Admin sab users dekh sakta hai
        if request.user.is_superuser:
            return qs

        # Zone Admin ko sirf apne zone ke users
        zone = get_admin_zone(request)

        if zone:
            return qs.filter(profile__zone=zone)

        return qs.none()

    def has_module_permission(self, request):
        if not request.user.is_authenticated:
            return False

        return (
            request.user.is_superuser
            or get_admin_zone(request) is not None
        )

    def has_view_permission(self, request, obj=None):
        if not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        zone = get_admin_zone(request)

        if not zone:
            return False

        if obj is None:
            return True

        try:
            return obj.profile.zone_id == zone.id
        except Profile.DoesNotExist:
            return False

    def has_change_permission(self, request, obj=None):
        return self.has_view_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        return self.has_view_permission(request, obj)

    def has_add_permission(self, request):
        if not request.user.is_authenticated:
            return False

        return (
            request.user.is_superuser
            or get_admin_zone(request) is not None
        )

    def save_formset(self, request, form, formset, change):
        """
        Zone Admin jab user/profile create karega,
        profile automatically usi zone mein save hoga.
        """

        instances = formset.save(commit=False)

        zone = get_admin_zone(request)

        for instance in instances:
            if isinstance(instance, Profile):
                if not request.user.is_superuser and zone:
                    instance.zone = zone

            instance.save()

        formset.save_m2m()


# Django ka default UserAdmin remove karke apna zone-aware admin lagana
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
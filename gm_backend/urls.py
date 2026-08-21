from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import render


# =========================
# HTML PAGE VIEWS
# =========================

def home(request):
    return render(request, "index.html")


def login_page(request):
    return render(request, "login.html")


def register_page(request):
    # register.html alag file nahi hai -- login.html mein hi
    # "Sign Up" tab embedded hai, is liye wahi render hota hai.
    return render(request, "login.html")


def form_page(request):
    return render(request, "form.html")


def saved_properties_page(request):
    return render(request, "saved-properties.html")


def past_project_page(request):
    return render(request, "past-project.html")


def property_page(request):
    return render(request, "property.html")


def my_listings_page(request):
    return render(request, "my-listings.html")


def owner_dashboard_page(request):
    return render(request, "owner-dashboard.html")


def my_profile_page(request):
    return render(request, "my-profile.html")


urlpatterns = [

    # =========================
    # WEBSITE PAGES
    # =========================

    path("", home, name="home"),
    path("login/", login_page, name="login"),
    path("register/", register_page, name="register"),
    path("form/", form_page, name="form"),
    path("saved-properties/", saved_properties_page, name="saved_properties"),
    path("past-project/", past_project_page, name="past_project"),
    path("property/", property_page, name="property"),
    path("my-listings/", my_listings_page, name="my_listings"),
    path("owner-dashboard/", owner_dashboard_page, name="owner_dashboard"),
    path("my-profile/", my_profile_page, name="my_profile"),

    # =========================
    # ADMIN
    # =========================

    path("admin/", admin.site.urls),

    # =========================
    # API ROUTES
    # =========================

    path("api/accounts/", include("accounts.urls")),
    path("api/properties/", include("properties.urls")),
]


# =========================
# MEDIA & STATIC FILES
# =========================

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )
"""
GM Real Estate - Django settings.
Yeh settings DEVELOPMENT ke liye hain (DEBUG=True, SQLite, sab origins
allowed for CORS). Production mein deploy karne se pehle SECRET_KEY,
DEBUG, ALLOWED_HOSTS, aur CORS settings zaroor tighten karein.
"""

from pathlib import Path
import os
import dj_database_url
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

# =========================================================
# SECURITY -- production mein SECRET_KEY ko environment variable
# se load karein, yahan hardcode na rakhein.
# =========================================================
SECRET_KEY = 'django-insecure-CHANGE-THIS-BEFORE-PRODUCTION-abc123xyz'

DEBUG = True

ALLOWED_HOSTS = ['*']  # Dev ke liye; production mein apna domain daalein

# =========================================================
# APPLICATIONS
# =========================================================
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',

    # Local apps
    'accounts',
    'properties',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # CorsMiddleware sab se upar honi chahiye
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'gm_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'gm_backend.wsgi.application'

# =========================================================
# DATABASE -- shuruaat ke liye SQLite. Baad mein PostgreSQL
# par switch karna ho to bas is DATABASES dict ko badalna hoga,
# baaki code (models/views) ko chhedne ki zaroorat nahi.
# =========================================================
import os
import dj_database_url

DATABASES = {
    'default': dj_database_url.config(
        default=os.getenv('DATABASE_URL')
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
    {'NAME': 'accounts.validators.StrongPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Karachi'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'

# Property images yahan upload hongi
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# =========================================================
# EMAIL (Gmail SMTP) -- Signup verification aur Forgot Password
# codes yahan se bhejte hain.
#
# ZAROORI: Gmail apna normal password SMTP ke liye allow NAHI karta.
# Aapko ek "App Password" banani hogi:
#   1. https://myaccount.google.com/security par jayein
#   2. "2-Step Verification" ON karein (agar pehle se nahi hai)
#   3. Usi page par "App passwords" dhoondein, ek naya app password
#      banayein (naam kuch bhi rakh dein, jaise "GM Real Estate")
#   4. Google aapko 16-character ka code dega (jaise: abcd efgh ijkl mnop)
#   5. Neeche EMAIL_HOST_PASSWORD mein WAHI 16-character code daalein
#      (apna Gmail login password NAHI)
# =========================================================
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True

EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')

DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

# =========================================================
# CORS -- frontend (index.html waghera) agar alag port/origin se
# chalayi jaye (e.g. Live Server par 127.0.0.1:5500) to yeh zaroori
# hai taake browser API calls ko block na kare.
# Development ke liye sab allow -- production mein apni asal domain
# CORS_ALLOWED_ORIGINS mein daal kar CORS_ALLOW_ALL_ORIGINS hata dein.
# =========================================================
CORS_ALLOW_ALL_ORIGINS = True

# =========================================================
# DJANGO REST FRAMEWORK
# Token authentication: login/signup par ek token milta hai, jo
# har agli request ke "Authorization: Token <key>" header mein
# bhejna hota hai (frontend ke fetch() calls mein).
# =========================================================
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
}
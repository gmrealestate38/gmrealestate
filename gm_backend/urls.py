"""
GM Real Estate - Root URL configuration.
"""

from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from django.conf import settings
from django.conf.urls.static import static


def home(request):
    return HttpResponse("""
        <html>
            <head>
                <title>GM Real Estate</title>
            </head>
            <body>
                <h1>GM Real Estate</h1>
                <p>Website is running successfully.</p>
                <p>Django backend is connected.</p>
            </body>
        </html>
    """)


urlpatterns = [
    path('', home, name='home'),

    path('admin/', admin.site.urls),

    path('api/accounts/', include('accounts.urls')),

    path('api/properties/', include('properties.urls')),
]


if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )
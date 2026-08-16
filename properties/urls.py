from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register('properties', views.PropertyViewSet, basename='property')

urlpatterns = [
    path('', include(router.urls)),
    path('contact-logs/', views.ContactLogListView.as_view(), name='contact-log-list'),
    path('saved/', views.SavedPropertyListCreateView.as_view(), name='saved-list-create'),
    path('saved/<int:property_id>/', views.SavedPropertyDeleteView.as_view(), name='saved-delete'),
]
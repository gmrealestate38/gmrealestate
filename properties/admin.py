from django.contrib import admin

from .models import ContactLog, Property, PropertyImage, SavedProperty


class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 1


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ('title', 'property_type', 'purpose', 'town', 'price', 'status', 'posted_by', 'created_at')
    list_filter = ('purpose', 'status', 'property_type', 'district')
    search_fields = ('title', 'town', 'exact_address', 'owner_contact')
    inlines = [PropertyImageInline]


@admin.register(ContactLog)
class ContactLogAdmin(admin.ModelAdmin):
    list_display = ('property', 'agent_phone', 'contacted_at')
    list_filter = ('contacted_at',)


@admin.register(SavedProperty)
class SavedPropertyAdmin(admin.ModelAdmin):
    list_display = ('user', 'property', 'saved_at')
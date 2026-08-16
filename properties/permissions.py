from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Koi bhi property list/dekh sakta hai (GET). Lekin edit/delete (PUT,
    PATCH, DELETE) sirf woh Agent kar sakta hai jisne woh property post
    ki thi (my-listings.html ke Edit/Delete buttons is par depend karte
    hain).
    """

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.posted_by_id == request.user.id


class IsAgent(permissions.BasePermission):
    """Sirf Agent role wale users hi nayi property post kar sakte hain."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        profile = getattr(request.user, 'profile', None)
        return profile is not None and profile.role == 'Agent'
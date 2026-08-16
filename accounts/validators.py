"""
GM Real Estate - Custom password strength validator.
Django ke AUTH_PASSWORD_VALIDATORS list mein add hota hai (settings.py
dekhein) taake yeh rule signup AUR password-reset dono jagah automatically
apply ho (kyunke dono jagah `validate_password()` call hoti hai).
"""

import re

from django.core.exceptions import ValidationError


class StrongPasswordValidator:
    """
    Password mein yeh sab hona zaroori hai:
      - Kam az kam 8 characters
      - Kam az kam 1 bara harf (A-Z)
      - Kam az kam 1 chota harf (a-z)
      - Kam az kam 1 number (0-9)
      - Kam az kam 1 special character (!@#$% waghera)
    """

    SPECIAL_CHARS_PATTERN = r'[!@#$%^&*(),.?":{}|<>_\-+=\[\];\'`~/\\]'

    def validate(self, password, user=None):
        errors = []

        if len(password) < 8:
            errors.append('Password kam az kam 8 characters ka hona chahiye.')
        if not re.search(r'[A-Z]', password):
            errors.append('Password mein kam az kam ek bara harf (A-Z) hona chahiye.')
        if not re.search(r'[a-z]', password):
            errors.append('Password mein kam az kam ek chota harf (a-z) hona chahiye.')
        if not re.search(r'[0-9]', password):
            errors.append('Password mein kam az kam ek number hona chahiye.')
        if not re.search(self.SPECIAL_CHARS_PATTERN, password):
            errors.append('Password mein kam az kam ek special character hona chahiye (!@#$% waghera).')

        if errors:
            raise ValidationError(errors, code='password_too_weak')

    def get_help_text(self):
        return (
            'Password kam az kam 8 characters ka hona chahiye, jisme 1 bara harf, '
            '1 chota harf, 1 number, aur 1 special character (!@#$% waghera) shamil ho.'
        )

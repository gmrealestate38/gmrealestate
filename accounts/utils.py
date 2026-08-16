import random

from django.conf import settings
from django.core.mail import send_mail


def generate_otp_code():
    """6-digit random code banata hai, e.g. '482913'."""
    return str(random.randint(100000, 999999))


def send_otp_email(email, code, purpose):
    """
    Gmail SMTP ke zariye (settings.py mein configure hai) asal email
    bhejta hai. Agar EMAIL settings sahi na hon, yeh function error
    dega -- views.py isko try/except mein wrap karta hai.
    """
    if purpose == 'signup':
        subject = 'GM Real Estate - Aapka Verification Code'
        message = (
            f'Aapka GM Real Estate account verify karne ka code hai: {code}\n\n'
            'Yeh code 10 minute ke liye valid hai. Agar aapne yeh request nahi ki, '
            'is email ko nazar andaz kar dein.'
        )
    else:
        subject = 'GM Real Estate - Password Reset Code'
        message = (
            f'Aapka password reset code hai: {code}\n\n'
            'Yeh code 10 minute ke liye valid hai. Agar aapne yeh request nahi ki, '
            'is email ko nazar andaz kar dein -- aapka password change nahi hoga.'
        )

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )
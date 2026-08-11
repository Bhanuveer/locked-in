from datetime import timedelta

from django.utils import timezone


def award_points(profile, amount: int, mark_active_today: bool = True):
    """Adds points to a student's profile and updates their daily streak."""
    profile.points += max(amount, 0)

    if mark_active_today:
        today = timezone.localdate()
        if profile.last_active_date == today:
            pass
        elif profile.last_active_date == today - timedelta(days=1):
            profile.streak_days += 1
            profile.last_active_date = today
        else:
            profile.streak_days = 1
            profile.last_active_date = today

    profile.save()
    return profile

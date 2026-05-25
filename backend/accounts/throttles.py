from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    scope = 'auth_login'


class RegisterRateThrottle(AnonRateThrottle):
    scope = 'auth_register'


class OTPRateThrottle(AnonRateThrottle):
    scope = 'auth_otp'


class PasswordResetRateThrottle(AnonRateThrottle):
    scope = 'auth_reset'

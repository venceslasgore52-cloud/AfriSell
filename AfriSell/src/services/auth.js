import { api } from './api'

export const authService = {
  login: (email, password) =>
    api.post('/api/accounts/auth/login/', { email, password }),

  register: (data) =>
    api.post('/api/accounts/auth/register/', data),

  logout: () =>
    api.post('/api/accounts/auth/logout/'),

  getMe: () =>
    api.get('/api/accounts/me/'),

  getProfile: () =>
    api.get('/api/accounts/me/profile/'),

  updateMe: (data) =>
    api.patch('/api/accounts/me/', data),

  updateProfile: (data) =>
    api.patch('/api/accounts/me/profile/', data),

  getShop: () =>
    api.get('/api/accounts/me/shop/'),

  updateShop: (data) =>
    api.patch('/api/accounts/me/shop/', data),

  changePassword: (oldPassword, newPassword) =>
    api.post('/api/accounts/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
    }),

  requestPasswordReset: (email) =>
    api.post('/api/accounts/auth/password-reset/', { email }),

  confirmPasswordReset: (token, newPassword) =>
    api.post('/api/accounts/auth/password-reset/confirm/', {
      token,
      new_password: newPassword,
    }),

  verifyEmail: (token) =>
    api.post('/api/accounts/auth/verify-email/', { token }),

  socialLogin: (provider, token) =>
    api.post('/api/accounts/auth/social/', { provider, token }),

  phoneSendOTP: (phone) =>
    api.post('/api/accounts/auth/phone/send-otp/', { phone }),

  phoneVerifyOTP: (phone, otp, username) =>
    api.post('/api/accounts/auth/phone/verify-otp/', { phone, otp, ...(username ? { username } : {}) }),
}

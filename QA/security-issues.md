# Security Issues

## Critical Issues
- **Hardcoded Admin Credentials**: Admin email and password are hardcoded in AuthContext.tsx
- **Lack of Password Encryption**: Passwords are stored in plaintext in localStorage
- **No CSRF Protection**: The application is vulnerable to Cross-Site Request Forgery attacks
- **Missing Input Validation**: Many forms lack proper validation, potential for XSS attacks
- **Insecure localStorage Usage**: Sensitive data is stored unencrypted in localStorage

## Recommended Fixes
- Implement proper authentication with JWT or OAuth
- Add server-side validation
- Use secure HttpOnly cookies instead of localStorage for sensitive data
- Implement CSRF tokens for form submissions
- Sanitize all user inputs

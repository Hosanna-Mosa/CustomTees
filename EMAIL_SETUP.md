# Email Configuration Setup

This document explains how to set up email functionality for the forgot password feature.

## Prerequisites

1. A Gmail account (or any SMTP-compatible email service)
2. Access to your email account settings

## Gmail Setup (Recommended)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification if not already enabled

### Step 2: Generate App Password
1. In Google Account settings, go to Security
2. Under "2-Step Verification", click on "App passwords"
3. Select "Mail" as the app
4. Select "Other" as the device and enter "CustomTees Backend"
5. Copy the generated 16-character password

### Step 3: Configure Environment Variables
Create a `.env` file in the `backend` directory with the following content:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/customtees

# JWT
JWT_SECRET=your_jwt_secret_key_here

# Email Configuration (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_character_app_password
EMAIL_FROM=your_email@gmail.com

# Server
PORT=3000
NODE_ENV=development
```

Replace the following values:
- `your_email@gmail.com` with your actual Gmail address
- `your_16_character_app_password` with the App Password generated in Step 2
- `your_jwt_secret_key_here` with a secure random string

## Alternative Email Providers

### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your_email@outlook.com
EMAIL_PASS=your_password
EMAIL_FROM=your_email@outlook.com
```

### Yahoo Mail
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your_email@yahoo.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@yahoo.com
```

## Testing the Setup

1. Start the backend server: `cd backend && npm run dev`
2. Navigate to the login page
3. Click "Forgot Password"
4. Enter a valid email address
5. Check the email inbox for the verification code

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Ensure 2FA is enabled on your Gmail account
   - Use App Password instead of regular password
   - Check that the email and password are correct

2. **Connection Timeout**
   - Verify the SMTP host and port settings
   - Check firewall settings
   - Ensure internet connection is stable

3. **Emails Not Received**
   - Check spam/junk folder
   - Verify the email address is correct
   - Check email provider's sending limits

### Security Notes

- Never commit the `.env` file to version control
- Use App Passwords instead of regular passwords
- Keep your email credentials secure
- Consider using environment-specific email accounts for production

## Production Considerations

For production deployment:
1. Use a dedicated email service (SendGrid, Mailgun, etc.)
2. Set up proper DNS records (SPF, DKIM, DMARC)
3. Monitor email delivery rates
4. Implement rate limiting for forgot password requests
5. Use environment variables for all sensitive data

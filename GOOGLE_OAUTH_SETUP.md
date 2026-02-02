# Google OAuth Setup Guide for Admin Login

This guide will help you set up Google OAuth for admin-only login access.

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (or Google People API)

## Step 2: Create OAuth 2.0 Credentials

1. In Google Cloud Console, go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Choose **Web application** as the application type
4. Set the following:
   - **Name**: Booking System Admin Login
   - **Authorized JavaScript origins**: `http://localhost:3000` (for development)
   - **Authorized redirect URIs**: `http://localhost:3000/auth/google/callback`

## Step 3: Configure Environment Variables

Update your `.env` file with the OAuth credentials:

```env
# Google OAuth for Admin Login
GOOGLE_CLIENT_ID=your_actual_google_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret_here
ADMIN_EMAIL=your_admin_email@gmail.com
```

**Important**: Replace `your_admin_email@gmail.com` with your actual Gmail address that should have admin access.

## Step 4: Install Dependencies

Run the following command to install the required packages:

```bash
npm install
```

## Step 5: Test Admin Login

1. Start your application: `npm start`
2. Go to `http://localhost:3000`
3. Click "Admin Login with Google"
4. Sign in with the Google account matching your `ADMIN_EMAIL`
5. You should be redirected to the admin dashboard

## Security Features

- **Email Restriction**: Only the email specified in `ADMIN_EMAIL` can access admin functions
- **OAuth Only**: Admin accounts cannot be created through regular registration
- **Automatic Account Creation**: Admin account is created automatically on first Google login
- **Session Management**: Admin sessions are managed securely

## Production Setup

For production deployment:

1. **Update Authorized Origins**: Add your production domain
   - Example: `https://yourdomain.com`

2. **Update Redirect URIs**: Add production callback URL
   - Example: `https://yourdomain.com/auth/google/callback`

3. **Environment Variables**: Set production environment variables
   - Use your production domain in OAuth settings
   - Keep `ADMIN_EMAIL` as your actual admin email

4. **SSL Certificate**: Ensure your production site uses HTTPS

## Troubleshooting

**Error: "Unauthorized admin access"**
- Check that your Google account email matches exactly with `ADMIN_EMAIL` in `.env`
- Ensure there are no extra spaces or typos in the email

**Error: "redirect_uri_mismatch"**
- Verify that the redirect URI in Google Cloud Console matches exactly: `http://localhost:3000/auth/google/callback`
- For production, use your actual domain

**Error: "invalid_client"**
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correctly set in `.env`
- Ensure the OAuth client is enabled in Google Cloud Console

## Admin Features

Once logged in as admin, you can:
- Manage all users and experts
- Monitor system activity
- Generate reports
- Configure system settings
- Access administrative tools

The admin dashboard is completely separate from user/expert functionality and provides comprehensive system oversight.
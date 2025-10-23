
# Daily Reminder Notifications Setup

This document explains how to set up daily reminder notifications for the Seamless Smile Tracker app.

## Overview

The app supports sending daily reminder notifications to users via PWA push notifications. Users can configure when they want to receive reminders in the settings.

## How It Works

1. Users enable notifications in Settings > Notifications
2. Users set their preferred reminder time (e.g., 21:00)
3. A cron job calls the daily reminder API endpoint every hour
4. The API sends push notifications to users whose reminder time matches the current hour

## Setup Instructions

### 1. Environment Variables

Make sure the following environment variables are set in your `.env` file:

```env
# VAPID keys for Web Push (already configured)
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key

# Optional: Secret for securing the cron endpoint
CRON_SECRET=your_random_secret_key
```

### 2. Set Up Cron Job

You have several options for setting up the cron job:

#### Option A: Using Vercel Cron Jobs (Recommended for Vercel deployments)

Create a `vercel.json` file in the root of your project:

```json
{
  "crons": [
    {
      "path": "/api/notifications/daily-reminder",
      "schedule": "0 * * * *"
    }
  ]
}
```

This will call the endpoint every hour at minute 0.

#### Option B: Using External Cron Service (e.g., cron-job.org, EasyCron)

1. Sign up for a cron job service
2. Create a new cron job with:
   - URL: `https://your-domain.com/api/notifications/daily-reminder`
   - Method: POST
   - Schedule: Every hour (0 * * * *)
   - Headers: `Authorization: Bearer YOUR_CRON_SECRET` (if using CRON_SECRET)

#### Option C: Using GitHub Actions (For testing/development)

Create `.github/workflows/daily-reminders.yml`:

```yaml
name: Send Daily Reminders

on:
  schedule:
    - cron: '0 * * * *'  # Run every hour
  workflow_dispatch:  # Allow manual trigger

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Send Daily Reminders
        run: |
          curl -X POST https://your-domain.com/api/notifications/daily-reminder \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### 3. Testing

To test the daily reminder functionality:

1. Enable notifications in Settings > Notifications
2. Make sure you have push notifications enabled in your browser
3. Call the test endpoint manually:

```bash
curl -X POST https://your-domain.com/api/notifications/test-daily-reminder \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

Or simply create a test button in the settings page that calls this endpoint.

## API Endpoints

### POST /api/notifications/daily-reminder
Main endpoint for sending daily reminders. Should be called by cron job.

**Headers:**
- `Authorization: Bearer YOUR_CRON_SECRET` (optional, for security)

**Response:**
```json
{
  "success": true,
  "usersProcessed": 10,
  "notificationsSent": 15,
  "notificationsFailed": 0
}
```

### POST /api/notifications/test-daily-reminder
Test endpoint for sending a daily reminder to the current user.

**Authentication:** Requires valid session

**Response:**
```json
{
  "success": true,
  "message": "Daily reminder sent successfully",
  "notificationsSent": 1,
  "notificationsFailed": 0,
  "streak": 5
}
```

## Notification Content

The daily reminder notifications are personalized based on the user's streak:

- **No streak:** "⏰ Time to Track Your Wear Time! - Remember to log your aligner wear time for today."
- **With streak:** "🔥 X Day Streak! - Keep it going! Don't break your X-day streak. Log your wear time now."

## Troubleshooting

### Notifications not being sent

1. Check that VAPID keys are correctly configured
2. Verify that users have push subscriptions in the database
3. Check the cron job logs to see if it's being executed
4. Ensure the user's reminder time is set correctly

### Users not receiving notifications

1. Verify that the user has granted notification permissions in their browser
2. Check that the user has enabled daily reminders in settings
3. Test with the test endpoint to verify push notifications work
4. Check browser console for any errors

### Invalid/Expired Subscriptions

The system automatically removes expired or invalid push subscriptions when it encounters 410 or 404 errors during notification sending.

## Security Considerations

- Use CRON_SECRET to prevent unauthorized access to the daily reminder endpoint
- Ensure VAPID keys are kept secure and never committed to version control
- Monitor the endpoint for unusual activity


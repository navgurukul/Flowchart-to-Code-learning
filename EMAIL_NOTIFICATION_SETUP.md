# 📧 Email Notification Setup Guide

## Overview
Send welcome email to users when they log in for the first time using Firebase Cloud Functions + Email Service.

---

## 🎯 Architecture

```
User Login → Firebase Auth → Cloud Function Trigger → Email Service → User Inbox
```

---

## 📦 Option 1: Using Resend (Recommended - Free & Easy)

### Why Resend?
- ✅ 100 emails/day free
- ✅ Simple API
- ✅ No credit card needed
- ✅ Great deliverability

### Step 1: Get Resend API Key

1. Go to https://resend.com/
2. Sign up for free account
3. Go to API Keys section
4. Create new API key
5. Copy the key (starts with `re_`)

### Step 2: Add to Firebase Environment

```bash
# In your terminal
firebase functions:config:set resend.api_key="re_your_api_key_here"
```

### Step 3: Create Cloud Function

Create file: `functions/src/index.ts`

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';

admin.initializeApp();

const resend = new Resend(functions.config().resend.api_key);

export const sendWelcomeEmail = functions.auth.user().onCreate(async (user) => {
  const email = user.email;
  const displayName = user.displayName || 'Student';
  
  if (!email) {
    console.log('No email for user:', user.uid);
    return null;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'ProblemSolver Lab <onboarding@yourdomain.com>',
      to: [email],
      subject: '🎉 Welcome to ProblemSolver Lab!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to ProblemSolver Lab!</h1>
            </div>
            <div class="content">
              <h2>Hi ${displayName}! 👋</h2>
              
              <p>We're excited to have you join our learning community! You've just taken the first step towards mastering flowcharts and problem-solving.</p>
              
              <h3>🚀 What's Next?</h3>
              <ul>
                <li><strong>Learn:</strong> Start with our interactive lessons on flowcharts</li>
                <li><strong>Practice:</strong> Try 50+ exercises with instant feedback</li>
                <li><strong>Build:</strong> Create flowcharts and convert them to code</li>
                <li><strong>Master:</strong> Use AI-powered tools and dry run mode</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="https://your-app-url.com" class="button">Start Learning Now →</a>
              </div>
              
              <h3>💡 Pro Tips:</h3>
              <ul>
                <li>Complete lessons to unlock exercises</li>
                <li>Use the AI Import feature to convert hand-drawn flowcharts</li>
                <li>Try Dry Run mode to understand code execution step-by-step</li>
              </ul>
              
              <p>Need help? Just reply to this email - we're here to support your learning journey!</p>
              
              <p>Happy learning! 🎓</p>
              <p><strong>The ProblemSolver Lab Team</strong></p>
            </div>
            <div class="footer">
              <p>Made by ai.navgurukil LABS</p>
              <p>You received this email because you signed up for ProblemSolver Lab</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Error sending email:', error);
      return null;
    }

    console.log('Welcome email sent successfully:', data);
    
    // Store email sent status in database
    await admin.database().ref(`users/${user.uid}/emailsSent`).push({
      type: 'welcome',
      sentAt: admin.database.ServerValue.TIMESTAMP,
      emailId: data?.id
    });

    return data;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return null;
  }
});
```

### Step 4: Deploy Cloud Function

```bash
# Install dependencies
cd functions
npm install resend firebase-functions firebase-admin

# Deploy
firebase deploy --only functions
```

---

## 📦 Option 2: Using SendGrid (More Features)

### Step 1: Get SendGrid API Key

1. Go to https://sendgrid.com/
2. Sign up (100 emails/day free)
3. Create API key
4. Copy the key

### Step 2: Add to Firebase

```bash
firebase functions:config:set sendgrid.api_key="SG.your_api_key_here"
```

### Step 3: Create Cloud Function

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as sgMail from '@sendgrid/mail';

admin.initializeApp();
sgMail.setApiKey(functions.config().sendgrid.api_key);

export const sendWelcomeEmail = functions.auth.user().onCreate(async (user) => {
  const email = user.email;
  const displayName = user.displayName || 'Student';
  
  if (!email) return null;

  const msg = {
    to: email,
    from: 'noreply@yourdomain.com', // Must be verified in SendGrid
    subject: '🎉 Welcome to ProblemSolver Lab!',
    html: `
      <!-- Same HTML template as above -->
    `
  };

  try {
    await sgMail.send(msg);
    console.log('Welcome email sent to:', email);
    
    await admin.database().ref(`users/${user.uid}/emailsSent`).push({
      type: 'welcome',
      sentAt: admin.database.ServerValue.TIMESTAMP
    });
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return null;
  }
});
```

---

## 📦 Option 3: Client-Side Email (Quick Test)

For testing without Cloud Functions, you can use EmailJS:

### Step 1: Setup EmailJS

1. Go to https://www.emailjs.com/
2. Sign up for free (200 emails/month)
3. Create email service
4. Create email template
5. Get your credentials

### Step 2: Install EmailJS

```bash
npm install @emailjs/browser
```

### Step 3: Add to AuthContext

```typescript
import emailjs from '@emailjs/browser';

// In signInWithGoogle function, after successful login:
const sendWelcomeEmail = async (user: FirebaseUser) => {
  try {
    await emailjs.send(
      'YOUR_SERVICE_ID',
      'YOUR_TEMPLATE_ID',
      {
        to_email: user.email,
        to_name: user.displayName || 'Student',
        from_name: 'ProblemSolver Lab'
      },
      'YOUR_PUBLIC_KEY'
    );
    console.log('Welcome email sent!');
  } catch (error) {
    console.error('Email error:', error);
  }
};

// Call it after login
if (firebaseUser && firebaseUser.email) {
  setCurrentUser(mapFirebaseUserToAppUser(firebaseUser));
  
  // Check if first login
  const userRef = ref(db, `users/${firebaseUser.uid}/firstLogin`);
  const snapshot = await get(userRef);
  
  if (!snapshot.exists()) {
    // First time login - send welcome email
    await sendWelcomeEmail(firebaseUser);
    await set(userRef, true);
  }
  
  toast.success(welcomeMessage);
}
```

---

## 🎨 Email Template Variations

### Simple Text Version

```html
Hi ${displayName}!

Welcome to ProblemSolver Lab! 🎉

You've just joined a community of learners mastering flowcharts and problem-solving.

What's next?
• Start with interactive lessons
• Practice with 50+ exercises
• Build flowcharts and convert to code
• Use AI-powered tools

Start learning: https://your-app-url.com

Happy learning!
The ProblemSolver Lab Team
```

### Rich HTML Version (Already shown above)

---

## 🔧 Testing

### Test Cloud Function Locally

```bash
# Install Firebase emulator
firebase emulators:start

# Trigger function by creating test user
# Check logs for email sending
```

### Test in Production

1. Deploy function
2. Create new user account
3. Check email inbox
4. Check Firebase Console → Functions → Logs

---

## 📊 Track Email Delivery

Add to your analytics:

```typescript
// In Cloud Function
analyticsService.trackFeatureUsed('welcome_email_sent', {
  user_id: user.uid,
  email: user.email
});
```

---

## 🚀 Quick Start (Recommended Path)

1. **Use Resend** (easiest, no credit card)
2. Get API key from resend.com
3. Set up Cloud Function (copy code above)
4. Deploy: `firebase deploy --only functions`
5. Test by creating new account
6. Done! ✅

---

## 💰 Cost Comparison

| Service | Free Tier | Cost After |
|---------|-----------|------------|
| Resend | 100/day | $20/month for 50k |
| SendGrid | 100/day | $15/month for 40k |
| EmailJS | 200/month | $7/month for 1k |

**Recommendation:** Start with Resend (best free tier)

---

## 🐛 Troubleshooting

### Email not sending?
- Check API key is correct
- Verify sender email domain
- Check Cloud Function logs
- Ensure user has email address

### Email goes to spam?
- Verify sender domain (SPF/DKIM)
- Use professional email content
- Avoid spam trigger words
- Use reputable email service

### Function not triggering?
- Check Firebase Console → Functions
- Verify function is deployed
- Check user creation event
- Review function logs

---

## 📝 Next Steps

After welcome email, you can add:
- Lesson completion emails
- Exercise achievement emails
- Weekly progress reports
- Reminder emails for inactive users

---

**Want me to implement this? Just say:**
```
Implement email notifications with Resend
```

And I'll set it all up! 📧✨

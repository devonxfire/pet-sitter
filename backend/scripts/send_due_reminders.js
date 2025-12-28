// Script to send due reminders via email using Prisma and Mailgun
// Run this script on a schedule (e.g., every 5 minutes) via cron or a process manager

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Mailgun = require('mailgun.js');
const formData = require('form-data');
require('dotenv').config();

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY,
  url: 'https://api.mailgun.net',
});

const FROM_EMAIL = process.env.MAILGUN_FROM_EMAIL || 'reminders@petdaily.app';

async function sendReminders() {
  // Find all reminders due at or before now and not sent (catch up any missed reminders)
  const now = new Date();
  const dueReminders = await prisma.reminder.findMany({
    where: {
      sent: false,
      remindAt: { lte: now },
    },
    include: {
      user: true,
      activity: {
        include: { pet: true, activityType: true }
      }
    }
  });

  for (const reminder of dueReminders) {
    // Capitalize activity name for subject
    const activityNameCapitalized = activityName.charAt(0).toUpperCase() + activityName.slice(1);
    const subject = `PetDaily Reminder: ${activityNameCapitalized} for ${petName}`;
    // Calculate minutes before activity
    const minutesBefore = Math.round((reminder.activity.timestamp - reminder.remindAt) / 60000);
    const activityName = reminder.activity.activityType.name;
    const petName = reminder.activity.pet.name;
    const firstName = reminder.user.name?.split(' ')[0] || reminder.user.name || '';
    const logoUrl = 'https://petdaily.app/logo.png'; // Replace with your actual logo URL
    const themeColor = '#4F46E5'; // Example theme color (indigo-600)
    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;border:1px solid #eee;border-radius:8px;overflow:hidden;">
        <div style="background:${themeColor};padding:24px 0;text-align:center;">
          <img src="${logoUrl}" alt="PetDaily" style="height:48px;margin-bottom:8px;" />
          <h2 style="color:#fff;margin:0;font-size:1.6em;">Hi${firstName ? ' ' + firstName : ''}!</h2>
        </div>
        <div style="padding:24px 24px 16px 24px;">
          <p style="font-size:1.1em;margin-top:0;">This is your <b>${minutesBefore} minute</b> reminder for <b>${activityName}</b> for <b>${petName}</b>.</p>
          <ul style="font-size:1em;line-height:1.7;margin:0 0 1em 0;padding:0 0 0 1.2em;">
            <li><strong>Activity:</strong> ${activityName}</li>
            <li><strong>Pet:</strong> ${petName}</li>
            <li><strong>Notes:</strong> ${reminder.activity.notes || 'None'}</li>
          </ul>
          <p style="font-size:1.05em;color:#444;">Have a great day!<br><b>— The PetDaily Team 🐾</b></p>
        </div>
      </div>
    `;
    try {
      await mg.messages.create(process.env.MAILGUN_DOMAIN, {
        from: FROM_EMAIL,
        to: reminder.email,
        subject,
        html,
      });
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { sent: true, sentAt: new Date() },
      });
      console.log(`✅ Sent reminder email to ${reminder.email} for activity ${reminder.activityId}`);
    } catch (err) {
      console.error(`❌ Failed to send reminder to ${reminder.email}:`, err.message);
    }
  }
}

sendReminders().then(() => prisma.$disconnect());

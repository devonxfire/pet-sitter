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
  // Find all reminders due in the past 10 minutes and not sent
  const now = new Date();
  const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000);
  const dueReminders = await prisma.reminder.findMany({
    where: {
      sent: false,
      remindAt: { lte: now, gte: tenMinsAgo },
    },
    include: {
      user: true,
      activity: {
        include: { pet: true, activityType: true }
      }
    }
  });

  for (const reminder of dueReminders) {
    const subject = `PetDaily Reminder: ${reminder.activity.activityType.name} for ${reminder.activity.pet.name}`;
    const text = `Hi ${reminder.user.name},\n\nThis is your reminder to ${reminder.activity.activityType.name.toLowerCase()} for ${reminder.activity.pet.name}.\n\nNotes: ${reminder.activity.notes || 'None'}\n\n-- PetDaily`;
    try {
      await mg.messages.create(process.env.MAILGUN_DOMAIN, {
        from: FROM_EMAIL,
        to: reminder.email,
        subject,
        text,
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

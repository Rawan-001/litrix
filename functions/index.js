import { onRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import nodemailer from 'nodemailer';

if (!getApps().length) 
  initializeApp();


const db = getFirestore();
const auth = getAuth();


export const ping = onRequest({ timeoutSeconds: 30 }, (req, res) => {
  res.status(200).send("✅ Gen 2 Cloud Functions working!");
});

export const sendInvitationEmailHttp = onRequest({ timeoutSeconds: 30 }, async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send({ success: false, message: 'Method Not Allowed' });
  }

  const { to, registrationLink, role, department = null, subject = 'Invitation to Register' } = req.body;

  if (!to || !registrationLink || !role) {
    return res.status(400).send({ success: false, message: 'Missing required fields' });
  }

  try {
    await db.collection('invitations').add({
      email: to,
      registrationLink,
      role,
      department,
      subject,
      needsEmail: true,
      sent: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).send({ success: true, message: 'Invitation saved in Firestore' });
  } catch (error) {
    console.error("Error saving invitation:", error);
    return res.status(500).send({ success: false, message: 'Error saving invitation' });
  }
});

export const sendInvitationOnCreate = onDocumentCreated(
  {
    document: 'invitations/{invitationId}',
    timeoutSeconds: 60,
  },
  async (event) => {
    const snap = event.data;
    const inv = snap.data();
    if (!inv.needsEmail || !inv.email || !inv.registrationLink || !inv.role) return;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'litrix.team@gmail.com',
        pass: 'xvefxmvskrlvcpqr'
      }
    });
    
    

    const htmlContent = `
     <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; padding: 20px; border-radius: 10px;">
    <div style="max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 12px rgba(0,0,0,0.05);">
      <h2 style="color: #1890ff; text-align: center;">You're Invited to Join Litrix </h2>
      <p style="font-size: 16px; color: #333;">
        Welcome to <strong>Litrix</strong> — the Scientific Research Management System for universities.
        You have been invited to register in the system based on your academic role.
      </p>
      <p style="font-size: 16px;">
        <strong>Role:</strong> ${inv.role}<br>
        ${inv.department ? `<strong>Department:</strong> ${inv.department}<br>` : ''}
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inv.registrationLink}" style="background-color: #1890ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 16px;">
          Complete Registration
        </a>
      </div>
      <p style="font-size: 14px; color: #666;">
        Or copy and paste the following link into your browser:
        <br>
        <a href="${inv.registrationLink}" style="color: #1890ff;">${inv.registrationLink}</a>
      </p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="font-size: 12px; color: #999; text-align: center;">
        This invitation link is valid for 48 hours only.<br>
        If you did not expect this invitation, please ignore this email.
      </p>
      <p style="text-align: center; font-size: 13px; color: #aaa;">
        — Litrix Team 
      </p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: 'no-reply@litrix.io',
        to: inv.email,
        subject: inv.subject || 'Invitation to Register',
        html: htmlContent,
      });

      await snap.ref.update({
        sent: true,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ Email sent to ${inv.email}`);
    } catch (error) {
      console.error('❌ Email failed:', error.message);
      await snap.ref.update({
        sent: false,
        errorMessage: error.message,
      });
    }
  }
);

export const sendManualNotification = onRequest({ timeoutSeconds: 30 }, async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send({ success: false, message: 'Method Not Allowed' });
  }

  const { scholarId, title, type = 'manual' } = req.body;

  if (!scholarId || !title) {
    return res.status(400).send({ success: false, message: 'Missing required fields' });
  }

  try {
    await db.collection('notifications').add({
      type,
      scholarId,
      title,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).send({ success: true, message: 'Manual notification sent' });
  } catch (error) {
    console.error('❌ Manual notification failed:', error.message);
    return res.status(500).send({ success: false, message: 'Error sending manual notification' });
  }
});

export const sendNotificationOnNewPublication = onDocumentCreated(
  {
    document: 'colleges/{college}/departments/{department}/faculty_members/{scholarId}/publications/{pubId}',
    timeoutSeconds: 30,
  },
  async (event) => {
    const data = event.data.data();
    const { scholarId } = event.params;

    if (!data || !scholarId) return;

    try {
      await db.collection('notifications').add({
        type: 'new_publication',
        scholarId,
        title: data.title || '',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ Notification created for ${scholarId}`);
    } catch (error) {
      console.error('❌ Failed to create notification:', error.message);
    }
  }
  
);

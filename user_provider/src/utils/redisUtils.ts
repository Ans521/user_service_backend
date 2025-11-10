import admin from "firebase-admin";
import dotenv from 'dotenv';
import { PushPayload } from "../types/notification.type";
import { Message } from "firebase-admin/messaging";
import nodemailer from "nodemailer";

dotenv.config();

const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS!);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

// ✅ Send push to a specific device
export const sendPush = async ({
  tittle,
  message,
  deviceToken,
  status,
  type,
  data,
}: PushPayload) => {
  if (!deviceToken) {
    console.error('❌ No FCM token provided');
    return;
  }

  try {
    await admin.messaging().send({
      token: deviceToken,
      notification: {
        title: tittle,
        body: message,
      },
      data: {
        type: type || 'notification',
        message,
        status: status || '',
        provider: JSON.stringify(data) || ''
      }
    });
    console.log('✅ Push sent successfully!');
  } catch (error) {
    console.error('❌ Error sending push:', error);
  }
};

export const sendPushToAll = async (title: string, message: string, imageUrl: string, topic: string, type?: string) => {
  try {

    const messageToSend: Message = {
      topic,
      notification: {
        title,
        body: message,
      },
      data : {
        type : type || 'notification_all',
      }
      // android: {
      //   notification: {
      //     imageUrl: imageUrl
      //   }
      // },
      // apns: {
      //   fcmOptions: {
      //     imageUrl: imageUrl
      //   }
      // },
    };

    await admin.messaging().send(messageToSend);
    console.log('✅ Push broadcasted to allUsers!');
  } catch (error) {
    console.error('❌ Error sending push to all:', error);
  }
};

export const subscribeToTopic = async (deviceToken: string, topic: string) => {
  try {
    await admin.messaging().subscribeToTopic(deviceToken, topic);
    console.log(`✅ Device subscribed to ${topic}`);
  }
  catch (error) {
    console.error('❌ Error subscribing to topic:', error);
  }
}

export const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const toRad = (x: any) => (x * Math.PI) / 180;
  const φ1 = toRad(lat1), φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1), Δλ = toRad(lon2 - lon1);

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "anshsharma32387@gmail.com",
    pass: "gzmj xlyy pgnl vxtb",
  },
});

const mailOptions: nodemailer.SendMailOptions = {
  from: '"LocalPro" <support@locallpro.in>',
  subject: "Your OTP from LocalPro"
};

export const sendOtpMail = async (email: string, otp: string) => {
  mailOptions.to = email;
  mailOptions.html = `
  <p>Thank you for registering with <strong>LocallPro!</strong></p>
  <hr />
    <p>Here is your one-time OTP: <strong>${otp}</strong></p>
    <p>
      Please use this code to complete your registration. 
      If you didn’t request this, please ignore this email.
    </p>
    <p>
      Welcome aboard — we look forward to having you with us!<br>
        <hr />
      <strong>Best regards,</strong><br>
      The LocallPro Team
    </p>

`;

  console.log("Sending email to:", mailOptions);
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.response);
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
};

export const generateOtp = () => {
  return Math.floor(10000 * Math.random())
}
import admin from "firebase-admin";
import dotenv from 'dotenv';
import { PushPayload } from "../types/notification.type";

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


export const sendPushToAll = async (newService: any) => {
  try {
    await admin.messaging().send({
      topic : 'allUsers',
      notification: {
        title: "Admin Update",
        body: `Hii, Check Offer ${newService}`
      }
    });
    console.log('✅ Push broadcasted to allUsers!');
  } catch (error) {
    console.error('❌ Error sending push to all:', error);
  }
};

export const haversine = (lat1 : number, lon1 : number, lat2 : number, lon2 : number) => {
  const R = 6371e3;
  const toRad = (x : any) => (x * Math.PI) / 180;
  const φ1 = toRad(lat1), φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1), Δλ = toRad(lon2 - lon1);

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

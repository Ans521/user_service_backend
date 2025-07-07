import admin from "firebase-admin";

import dotenv from 'dotenv';
import { PushPayload } from "../types/notification.type";
dotenv.config();

const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS!);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

export const sendPush = async ({
  tittle,
  message,
  deviceToken,
  status,
  type,
  data,
}: PushPayload) => {
        const fcmToken = deviceToken;

        if (!fcmToken) {
            console.error('No FCM token provided');
            return;  
        }

        console.log(type, 'type');

      try {
        await admin.messaging().send({
          token: fcmToken,
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
  } catch (error) {
    console.error('Error sending push:', error);
  }
}

                
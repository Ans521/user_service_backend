import admin from "firebase-admin";

import dotenv from 'dotenv';
dotenv.config();

const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS!);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

export const sendPush = async (message : string, name : any, deviceToken : any) => {
    
    const fcmToken = deviceToken;
    
      try {
        await admin.messaging().send({
            token: fcmToken,
            notification: {
              title: `New message from the ${name}`,
              body: `${message}`,
            },
        });

  } catch (error) {
    console.error('Error sending push:', error);
  }
}

    
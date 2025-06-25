import admin from "firebase-admin";
import serviceAccount from "../public/local-professionals-firebase-adminsdk-fbsvc-31b56d4ffb.json";


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

    
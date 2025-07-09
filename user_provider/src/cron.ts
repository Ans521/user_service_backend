// import cron from 'node-cron';
// import moment from 'moment';
// import { ServiceProvider } from './models/serviceProvider';
// import { PushPayload } from './types/notification.type';
// import { User } from './models/user';
// import { sendPush } from './utils/redisUtils';
// console.log("🚀 cron.ts has started");

// cron.schedule('*/1 * * * *', async () => {
//   const timeAgo = moment().subtract(30, 'minutes').toDate();

//   const contactsToNotify = await ServiceProvider.aggregate([
//     {
//       $project: {
//         _id: 1,
//         recentConnectedUser: {
//           $filter: {
//             input: '$recentConnectedUser',
//             as: 'connectedUser',
//             cond: {
//               $and: [
//                 { $eq: ['$$connectedUser.isNotified', false] },
//                 { $lt: ['$$connectedUser.timeStamp', timeAgo] }
//               ]
//             }
//           }
//         },
//       }
//     },
//     {
//       $match: {
//         'recentConnectedUser.0': { $exists: true }
//       }
//     }
//   ]);


//   console.log("Contacts to notify:", JSON.stringify(contactsToNotify, null, 2));

//     if(contactsToNotify.length === 0) {
//       console.log("No contacts to notify");
//       return;
//     }
//     const updatePromises = contactsToNotify.map(async (contact) => {
//       const contactInfo : any = await ServiceProvider.findById(contact._id);
//       let dataToSend = {
//         providerId : contact._id,
//         providerName : contactInfo.name,
//       }
      
//       const recentConnectedUser = Promise.all(contact.recentConnectedUser.map(async (user : any) => {
//           const userInfo : any = await User.findOne(
//             {phoneNo : user.userPhoneRef},
//           ).select('deviceToken name').lean();
//           const payloadData = {
//             ...dataToSend,
//             userName : userInfo.name,
//             userId : userInfo._id,
//           }
//           const payload : PushPayload = {
//           tittle: "Notification",
//           message: "You have new enquiry",
//           deviceToken : contactInfo.deviceToken || '',
//           type : "enquiry",
//           data: JSON.stringify({
//             payloadData
//           })
          
//       }));
//       return;
//       if (!contactInfo) {
//         console.log(`Contact with ID ${contact._id} not found`);
//         return;
//       }
//         }
//         const updateResult = await ServiceProvider.updateOne(
//           { _id: contact._id },
//           {
//             $set: {
//               'recentConnectedUser.$[elem].isNotified': true
//             }
//           },
//           {
//             arrayFilters: [
//               { 
//                 'elem.isNotified': false ,
//                 'elem.timeStamp' : { $lt: timeAgo}
//               }
//             ]
//           }
//         );
//       }
//   )



  // await Promise.all(updatePromises);

//   console.log("Notification update completed");
// });



// const updatedRecentConnectedUser = await ServiceProvider.updateMany(
//    {
//     recentConnectedUser: {
//       $elemMatch: {
//         isNotified: false,
//         timeStamp: { $lt: timeAgo }
//       }
//     },
//     {
//       $set: {
//         'recentConnectedUser.$[elem].isNotified': true
//       }
//     },
//     {
//       arrayFilters : [
//         {}
//       ]
//     }
//    })
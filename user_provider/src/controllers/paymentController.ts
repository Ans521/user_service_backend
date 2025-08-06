import Razorpay from "razorpay";
import { Types } from "mongoose";
import { Order } from "../models/order";
import crypto from "crypto";
import { Offer } from "../models/offer";
import { ObjectId } from "mongoose";
import { ServiceProvider } from "../models/serviceProvider";
const razorpay = new Razorpay({
  key_id: "rzp_test_X1dulJU5zjt8JR",
  key_secret: "z7ztdMspvTvYDoqD7rFNjLDd",
});


// export const createOrder = async (req: any, res: any) => {
//   try {
//     const { amount } = req.body
//     const { id } = req.user


//     if (!amount || amount <= 0 || !id) {
//       return res.status(400).json({ success: false, message: "amount is required" })
//     }
//     const objId = new Types.ObjectId(String(id));

//     const options = {
//       amount,
//       currency: "INR",
//       receipt: `order_${Date.now()}`,
//     };

//     const order = await razorpay.orders.create(options);

//     res.status(200).json({ success: true, order });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };

// export const verifyPayment = async (req: any, res: any) => {
//   try {
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

//     // 🔒 Generate signature on backend & compare
//     const sign = razorpay_order_id + "|" + razorpay_payment_id;
//     const expectedSign = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
//       .update(sign)
//       .digest("hex");

//     if (razorpay_signature === expectedSign) {
//       console.log("✅ Payment Verified:", razorpay_payment_id);

//       // 💾 Update DB (mark order as PAID)
//       // db.orders.update({ order_id: razorpay_order_id }, { status: "paid", payment_id: razorpay_payment_id })

//       return res.json({ success: true, message: "Payment verified successfully" });
//     } else {
//       console.log("❌ Payment Verification Failed");
//       return res.status(400).json({ success: false, message: "Invalid signature" });
//     }
//   } catch (error) {
//     console.error("Error verifying payment:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// }

export const webHook = async (req: any, res: any) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];
  console.log("webhookSecret", webhookSecret);
  console.log("signature", signature);
  const shasum = crypto.createHmac("sha256", webhookSecret!);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest("hex");
  console.log("digest", digest);

  if (digest === signature) {
    console.log("✅ Webhook Verified:", req.body.event);

    const event = req.body.event;
    console.log("event", event);
    console.log("req.body", req.body)
    const order = req.body.payload.payment.entity;
    console.log("order", order);
    const providerId = order.notes.providerId;

    const offerId = order.notes.offerId;
   
    if (!providerId || !offerId) {
      console.log("❌ Missing providerId or offerId in order notes");
      return res.status(400).json({ status: "missing providerId or offerId" });
    }

    const offerObjId = new Types.ObjectId(String(offerId));
    const endDateOffer = await Offer.findById(offerObjId)

    if (!endDateOffer) {
      console.log("❌ Offer not found");
      return res.status(404).json({ status: "offer not found" });
    }

    const validity = endDateOffer.validity || 30;
    console.log("event", event)
    if (event === "payment.captured") {


      const createdOrder =await Order.create({
      providerId : new Types.ObjectId(String(providerId)),
      offerid: offerId,
      razorpay_order_id: order.id,
      status: "paid",
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + validity * 24 * 60 * 60 * 1000)
      });

      const orderId = createdOrder._id

      await ServiceProvider.findOneAndUpdate(
        { _id: new Types.ObjectId(String(providerId)) },
        { $set: { orderId } }
      )

    }else if (event === "payment.authorized") {
      const createdOrder =await Order.create({
      providerId : new Types.ObjectId(String(providerId)),
      offerid: offerId,
      razorpay_order_id: order.id,
      status: "paid",
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + validity * 24 * 60 * 60 * 1000)
      });

      const orderId = createdOrder._id

      await ServiceProvider.findOneAndUpdate(
        { _id: new Types.ObjectId(String(providerId)) },
        { $set: { orderId } }
      )
      console.log('Order created:', createdOrder);
    }


    if (event === "payment.failed") {

    const createdOrder =  await Order.create({
        providerId : new Types.ObjectId(String(providerId)),
        offerid: offerId,
        razorpay_order_id: order.order_id,
        status: "paid",
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + validity * 24 * 60 * 60 * 1000)
        });
      console.log('Order created:', createdOrder);  
    }
    return res.json({ status: "ok",  });
  } else {
    console.log("❌ Invalid webhook signature");
    return res.status(400).json({ status: "invalid signature" });
  }
};


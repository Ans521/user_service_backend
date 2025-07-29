import Razorpay from "razorpay";
import { Types } from "mongoose";
import { Order } from "../models/order";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: "your_test_key_id",  
  key_secret: "your_test_key_secret", 
});


export const createOrder = async (req: any, res: any) => {
  try {
    const {amount} = req.body
    const  {id} = req.user

    
    if(!amount || amount <= 0 || !id) {
        return res.status(400).json({success: false, message: "amount is required"})
    }
    const objId = new Types.ObjectId(String(id));
    
    const options = {
        amount, 
        currency: "INR",
        receipt: `order_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    
    await Order.create({
        order : order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        providerId: objId
    })

    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const verifyPayment = async (req: any, res: any) => {
      try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // 🔒 Generate signature on backend & compare
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(sign)
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      console.log("✅ Payment Verified:", razorpay_payment_id);

      // 💾 Update DB (mark order as PAID)
      // db.orders.update({ order_id: razorpay_order_id }, { status: "paid", payment_id: razorpay_payment_id })

      return res.json({ success: true, message: "Payment verified successfully" });
    } else {
      console.log("❌ Payment Verification Failed");
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

export const webHook = async (req : any, res : any) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];

  const shasum = crypto.createHmac("sha256", webhookSecret!);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest("hex");

  if (digest === signature) {
    console.log("✅ Webhook Verified:", req.body.event);

    // 💾 Update DB based on event
    const event = req.body.event;

    if (event === "order.paid") {
      // db.orders.update({ order_id: req.body.payload.order.entity.id }, { status: "paid" })
      console.log("📦 Order marked as paid via webhook");
    }

    if (event === "payment.failed") {
      // db.orders.update({ order_id: req.body.payload.payment.entity.order_id }, { status: "failed" })
      console.log("❌ Payment failed via webhook");
    }

    res.json({ status: "ok" });
  } else {
    console.log("❌ Invalid webhook signature");
    res.status(400).json({ status: "invalid signature" });
  }
});

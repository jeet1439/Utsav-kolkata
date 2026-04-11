import express from 'express';
import admin from '../lib/firebase.js';

const router = express.Router();
router.post("/send-notification", async (req, res) => {

  try {
    const { token, title, body } = req.body;

    if (!token) {
      return res.status(400).json({ error: "FCM token is required" });
    }

    const message = {
      token: token, // device token from frontend
      notification: {
        title: title || "Test Notification",
        body: body || "This is a test push notification ",
      },
      android: {
        notification: {
          icon: "ic_notification",
          color: "#d60096",
          channel_id: "default_channel",
        },
      },
      data: {
        type: "test",
      },
    };

    const response = await admin.messaging().send(message);

    res.status(200).json({
      success: true,
      response,
    });
  } catch (error) {
    console.error("Notification error:", error);
    res.status(500).json({
      error: error.message,
    });
  }
});


export default router;  

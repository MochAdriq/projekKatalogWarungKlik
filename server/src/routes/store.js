import express from "express";
import { db } from "../db/db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const settings = await db.getStoreSettings();
    res.json({
      success: true,
      data: settings,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/", authenticateToken, async (req, res) => {
  try {
    const { storeName, tagline, address, phone, slug, currency, activeWhatsApp } = req.body;
    const current = await db.getStoreSettings();
    const updated = await db.updateStoreSettings({
      storeName: storeName || current.storeName,
      tagline: tagline || current.tagline,
      slug: slug || current.slug,
      phone: phone ? phone.replace(/[^0-9]/g, "") : current.phone,
      currency: currency || current.currency,
      activeWhatsApp: activeWhatsApp !== undefined ? activeWhatsApp : current.activeWhatsApp,
      address: address !== undefined ? address : current.address,
    });

    res.json({
      success: true,
      data: updated,
      message: "Store settings updated successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

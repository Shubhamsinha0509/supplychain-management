const express = require("express");
const bodyParser = require("body-parser");
const QRGenerator = require("./qrGenerator");
const QRScanner = require("./qrScanner");

const app = express();
const PORT = process.env.PORT || 4002;

app.use(bodyParser.json());

const qrGen = new QRGenerator();
const qrScan = new QRScanner();

/* ------------------ QR GENERATION ------------------ */

// Batch QR
app.post("/qr/generate/batch", async (req, res) => {
  try {
    const result = await qrGen.generateBatchQR(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Event QR
app.post("/qr/generate/event", async (req, res) => {
  try {
    const result = await qrGen.generateEventQR(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Certificate QR
app.post("/qr/generate/certificate", async (req, res) => {
  try {
    const result = await qrGen.generateCertificateQR(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ------------------ QR SCANNING ------------------ */

// Scan QR
app.post("/qr/scan", async (req, res) => {
  try {
    const { qrData } = req.body;
    if (!qrData) {
      return res.status(400).json({ success: false, error: "qrData is required" });
    }

    const result = await qrScan.scanQRCode(qrData);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Direct parse (without fetching from APIs)
app.post("/qr/parse", (req, res) => {
  try {
    const { qrData } = req.body;
    if (!qrData) {
      return res.status(400).json({ success: false, error: "qrData is required" });
    }

    const result = qrScan.parseQRPayload(qrData);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ------------------ SERVER ------------------ */
app.listen(PORT, () => {
  console.log(`✅ QR Service running on http://localhost:${PORT}`);
});

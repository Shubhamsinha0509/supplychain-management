const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * QR Code Generator Service
 * Generates QR codes for batch tracking with embedded data
 */
class QRGenerator {
  constructor() {
    this.apiBaseUrl = process.env.API_BASE_URL || 'https://api.supplychain.com';
    this.appBaseUrl = process.env.APP_BASE_URL || 'https://app.supplychain.com';
  }

  /**
   * Generate QR code for a batch
   * @param {Object} batchData - Batch information
   * @param {Object} options - QR code generation options
   * @returns {Promise<Object>} QR code data and image
   */
  async generateBatchQR(batchData, options = {}) {
    try {
      const {
        batchId,
        produceType,
        farmer,
        harvestDate,
        qualityGrade,
        ipfsHash
      } = batchData;

      // Create QR payload
      const qrPayload = this.createQRPayload({
        batchId,
        produceType,
        farmer,
        harvestDate,
        qualityGrade,
        ipfsHash,
        timestamp: new Date().toISOString()
      });

      // Generate QR code options
      const qrOptions = {
        type: 'image/png',
        quality: 0.92,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: options.width || 300,
        errorCorrectionLevel: 'M',
        ...options
      };

      // Generate QR code image
      const qrCodeDataURL = await QRCode.toDataURL(qrPayload, qrOptions);
      
      // Generate QR code buffer for file storage
      const qrCodeBuffer = await QRCode.toBuffer(qrPayload, qrOptions);

      // Generate unique QR ID
      const qrId = this.generateQRId(batchId);

      return {
        success: true,
        data: {
          qrId,
          qrPayload,
          qrCodeDataURL,
          qrCodeBuffer,
          batchId,
          scanUrl: `${this.appBaseUrl}/scan/${qrId}`,
          apiUrl: `${this.apiBaseUrl}/api/batches/${batchId}`,
          metadata: {
            generatedAt: new Date().toISOString(),
            version: '1.0',
            type: 'batch_tracking'
          }
        }
      };

    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error(`QR code generation failed: ${error.message}`);
    }
  }

  /**
   * Generate QR code for batch events
   * @param {Object} eventData - Event information
   * @param {Object} options - QR code generation options
   * @returns {Promise<Object>} QR code data and image
   */
  async generateEventQR(eventData, options = {}) {
    try {
      const {
        batchId,
        eventType,
        actor,
        location,
        timestamp,
        ipfsHash
      } = eventData;

      const qrPayload = this.createEventQRPayload({
        batchId,
        eventType,
        actor,
        location,
        timestamp,
        ipfsHash
      });

      const qrOptions = {
        type: 'image/png',
        quality: 0.92,
        margin: 2,
        color: {
          dark: '#0066CC',
          light: '#FFFFFF'
        },
        width: options.width || 250,
        errorCorrectionLevel: 'M',
        ...options
      };

      const qrCodeDataURL = await QRCode.toDataURL(qrPayload, qrOptions);
      const qrCodeBuffer = await QRCode.toBuffer(qrPayload, qrOptions);
      const qrId = this.generateQRId(`${batchId}_${eventType}_${Date.now()}`);

      return {
        success: true,
        data: {
          qrId,
          qrPayload,
          qrCodeDataURL,
          qrCodeBuffer,
          batchId,
          eventType,
          scanUrl: `${this.appBaseUrl}/scan/event/${qrId}`,
          apiUrl: `${this.apiBaseUrl}/api/events/${qrId}`,
          metadata: {
            generatedAt: new Date().toISOString(),
            version: '1.0',
            type: 'event_tracking'
          }
        }
      };

    } catch (error) {
      console.error('Error generating event QR code:', error);
      throw new Error(`Event QR code generation failed: ${error.message}`);
    }
  }

  /**
   * Generate QR code for quality certificates
   * @param {Object} certificateData - Certificate information
   * @param {Object} options - QR code generation options
   * @returns {Promise<Object>} QR code data and image
   */
  async generateCertificateQR(certificateData, options = {}) {
    try {
      const {
        certificateId,
        batchId,
        certificateType,
        issuer,
        issueDate,
        expiryDate,
        ipfsHash
      } = certificateData;

      const qrPayload = this.createCertificateQRPayload({
        certificateId,
        batchId,
        certificateType,
        issuer,
        issueDate,
        expiryDate,
        ipfsHash
      });

      const qrOptions = {
        type: 'image/png',
        quality: 0.92,
        margin: 2,
        color: {
          dark: '#00AA00',
          light: '#FFFFFF'
        },
        width: options.width || 280,
        errorCorrectionLevel: 'H', // High error correction for certificates
        ...options
      };

      const qrCodeDataURL = await QRCode.toDataURL(qrPayload, qrOptions);
      const qrCodeBuffer = await QRCode.toBuffer(qrPayload, qrOptions);
      const qrId = this.generateQRId(`cert_${certificateId}`);

      return {
        success: true,
        data: {
          qrId,
          qrPayload,
          qrCodeDataURL,
          qrCodeBuffer,
          certificateId,
          batchId,
          scanUrl: `${this.appBaseUrl}/scan/certificate/${qrId}`,
          apiUrl: `${this.apiBaseUrl}/api/certificates/${certificateId}`,
          metadata: {
            generatedAt: new Date().toISOString(),
            version: '1.0',
            type: 'certificate_verification'
          }
        }
      };

    } catch (error) {
      console.error('Error generating certificate QR code:', error);
      throw new Error(`Certificate QR code generation failed: ${error.message}`);
    }
  }

  /**
   * Create QR payload for batch tracking
   * @param {Object} data - Batch data
   * @returns {string} JSON string payload
   */
  createQRPayload(data) {
    const payload = {
      type: 'batch_tracking',
      version: '1.0',
      data: {
        batchId: data.batchId,
        produceType: data.produceType,
        farmer: data.farmer,
        harvestDate: data.harvestDate,
        qualityGrade: data.qualityGrade,
        ipfsHash: data.ipfsHash,
        timestamp: data.timestamp
      },
      urls: {
        scan: `${this.appBaseUrl}/scan/${data.batchId}`,
        api: `${this.apiBaseUrl}/api/batches/${data.batchId}`,
        web: `${this.appBaseUrl}/batch/${data.batchId}`
      },
      signature: this.generateSignature(data)
    };

    return JSON.stringify(payload);
  }

  /**
   * Create QR payload for event tracking
   * @param {Object} data - Event data
   * @returns {string} JSON string payload
   */
  createEventQRPayload(data) {
    const payload = {
      type: 'event_tracking',
      version: '1.0',
      data: {
        batchId: data.batchId,
        eventType: data.eventType,
        actor: data.actor,
        location: data.location,
        timestamp: data.timestamp,
        ipfsHash: data.ipfsHash
      },
      urls: {
        scan: `${this.appBaseUrl}/scan/event/${data.batchId}`,
        api: `${this.apiBaseUrl}/api/events/${data.batchId}`,
        web: `${this.appBaseUrl}/event/${data.batchId}`
      },
      signature: this.generateSignature(data)
    };

    return JSON.stringify(payload);
  }

  /**
   * Create QR payload for certificate verification
   * @param {Object} data - Certificate data
   * @returns {string} JSON string payload
   */
  createCertificateQRPayload(data) {
    const payload = {
      type: 'certificate_verification',
      version: '1.0',
      data: {
        certificateId: data.certificateId,
        batchId: data.batchId,
        certificateType: data.certificateType,
        issuer: data.issuer,
        issueDate: data.issueDate,
        expiryDate: data.expiryDate,
        ipfsHash: data.ipfsHash
      },
      urls: {
        scan: `${this.appBaseUrl}/scan/certificate/${data.certificateId}`,
        api: `${this.apiBaseUrl}/api/certificates/${data.certificateId}`,
        web: `${this.appBaseUrl}/certificate/${data.certificateId}`
      },
      signature: this.generateSignature(data)
    };

    return JSON.stringify(payload);
  }

  /**
   * Generate unique QR ID
   * @param {string} input - Input string
   * @returns {string} Unique QR ID
   */
  generateQRId(input) {
    const hash = crypto.createHash('sha256');
    hash.update(input + Date.now().toString());
    return hash.digest('hex').substring(0, 16);
  }

  /**
   * Generate signature for QR payload
   * @param {Object} data - Data to sign
   * @returns {string} Signature
   */
  generateSignature(data) {
    const secret = process.env.QR_SIGNATURE_SECRET || 'default-secret';
    const hash = crypto.createHmac('sha256', secret);
    hash.update(JSON.stringify(data));
    return hash.digest('hex');
  }

  /**
   * Verify QR code signature
   * @param {Object} payload - QR payload
   * @param {string} signature - Signature to verify
   * @returns {boolean} Verification result
   */
  verifySignature(payload, signature) {
    const expectedSignature = this.generateSignature(payload.data);
    return expectedSignature === signature;
  }

  /**
   * Parse QR code payload
   * @param {string} qrData - QR code data
   * @returns {Object} Parsed payload
   */
  parseQRPayload(qrData) {
    try {
      const payload = JSON.parse(qrData);
      
      // Verify signature
      if (!this.verifySignature(payload, payload.signature)) {
        throw new Error('Invalid QR code signature');
      }

      return {
        success: true,
        data: payload
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate QR code with custom styling
   * @param {string} data - Data to encode
   * @param {Object} styleOptions - Styling options
   * @returns {Promise<Object>} Styled QR code
   */
  async generateStyledQR(data, styleOptions = {}) {
    const defaultOptions = {
      type: 'image/png',
      quality: 0.92,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 300,
      errorCorrectionLevel: 'M'
    };

    const options = { ...defaultOptions, ...styleOptions };

    try {
      const qrCodeDataURL = await QRCode.toDataURL(data, options);
      const qrCodeBuffer = await QRCode.toBuffer(data, options);

      return {
        success: true,
        data: {
          qrCodeDataURL,
          qrCodeBuffer,
          options
        }
      };
    } catch (error) {
      console.error('Error generating styled QR code:', error);
      throw new Error(`Styled QR code generation failed: ${error.message}`);
    }
  }

  /**
   * Generate multiple QR codes in batch
   * @param {Array} batchDataArray - Array of batch data
   * @param {Object} options - QR code generation options
   * @returns {Promise<Array>} Array of QR codes
   */
  async generateBatchQRCodes(batchDataArray, options = {}) {
    try {
      const qrCodes = await Promise.all(
        batchDataArray.map(batchData => 
          this.generateBatchQR(batchData, options)
        )
      );

      return {
        success: true,
        data: qrCodes.map(qr => qr.data),
        count: qrCodes.length
      };
    } catch (error) {
      console.error('Error generating batch QR codes:', error);
      throw new Error(`Batch QR code generation failed: ${error.message}`);
    }
  }
}

module.exports = QRGenerator;

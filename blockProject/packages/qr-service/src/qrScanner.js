const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * QR Code Scanner Service
 * Handles QR code scanning and validation
 */
class QRScanner {
  constructor() {
    this.apiBaseUrl = process.env.API_BASE_URL || 'https://api.supplychain.com';
    this.appBaseUrl = process.env.APP_BASE_URL || 'https://app.supplychain.com';
  }

  /**
   * Scan and parse QR code data
   * @param {string} qrData - QR code data string
   * @returns {Object} Parsed and validated QR data
   */
  async scanQRCode(qrData) {
    try {
      // Parse QR payload
      const parseResult = this.parseQRPayload(qrData);
      
      if (!parseResult.success) {
        return {
          success: false,
          error: parseResult.error,
          type: 'invalid_qr'
        };
      }

      const payload = parseResult.data;

      // Validate payload structure
      const validationResult = this.validatePayload(payload);
      if (!validationResult.success) {
        return {
          success: false,
          error: validationResult.error,
          type: 'invalid_payload'
        };
      }

      // Determine QR type and handle accordingly
      const qrType = payload.type;
      let result;

      switch (qrType) {
        case 'batch_tracking':
          result = await this.handleBatchTrackingQR(payload);
          break;
        case 'event_tracking':
          result = await this.handleEventTrackingQR(payload);
          break;
        case 'certificate_verification':
          result = await this.handleCertificateQR(payload);
          break;
        default:
          return {
            success: false,
            error: 'Unknown QR code type',
            type: 'unknown_type'
          };
      }

      return result;

    } catch (error) {
      console.error('Error scanning QR code:', error);
      return {
        success: false,
        error: error.message,
        type: 'scan_error'
      };
    }
  }

  /**
   * Handle batch tracking QR code
   * @param {Object} payload - QR payload
   * @returns {Object} Batch information
   */
  async handleBatchTrackingQR(payload) {
    try {
      const { batchId } = payload.data;
      
      // Fetch batch information from API
      const batchInfo = await this.fetchBatchInfo(batchId);
      
      if (!batchInfo.success) {
        return {
          success: false,
          error: 'Batch not found',
          type: 'batch_not_found'
        };
      }

      return {
        success: true,
        type: 'batch_tracking',
        data: {
          batch: batchInfo.data,
          qrData: payload.data,
          urls: payload.urls,
          metadata: {
            scannedAt: new Date().toISOString(),
            version: payload.version
          }
        }
      };

    } catch (error) {
      console.error('Error handling batch tracking QR:', error);
      return {
        success: false,
        error: error.message,
        type: 'batch_handling_error'
      };
    }
  }

  /**
   * Handle event tracking QR code
   * @param {Object} payload - QR payload
   * @returns {Object} Event information
   */
  async handleEventTrackingQR(payload) {
    try {
      const { batchId, eventType } = payload.data;
      
      // Fetch event information from API
      const eventInfo = await this.fetchEventInfo(batchId, eventType);
      
      if (!eventInfo.success) {
        return {
          success: false,
          error: 'Event not found',
          type: 'event_not_found'
        };
      }

      return {
        success: true,
        type: 'event_tracking',
        data: {
          event: eventInfo.data,
          qrData: payload.data,
          urls: payload.urls,
          metadata: {
            scannedAt: new Date().toISOString(),
            version: payload.version
          }
        }
      };

    } catch (error) {
      console.error('Error handling event tracking QR:', error);
      return {
        success: false,
        error: error.message,
        type: 'event_handling_error'
      };
    }
  }

  /**
   * Handle certificate verification QR code
   * @param {Object} payload - QR payload
   * @returns {Object} Certificate information
   */
  async handleCertificateQR(payload) {
    try {
      const { certificateId } = payload.data;
      
      // Fetch certificate information from API
      const certificateInfo = await this.fetchCertificateInfo(certificateId);
      
      if (!certificateInfo.success) {
        return {
          success: false,
          error: 'Certificate not found',
          type: 'certificate_not_found'
        };
      }

      // Verify certificate validity
      const verificationResult = this.verifyCertificate(certificateInfo.data);
      
      return {
        success: true,
        type: 'certificate_verification',
        data: {
          certificate: certificateInfo.data,
          verification: verificationResult,
          qrData: payload.data,
          urls: payload.urls,
          metadata: {
            scannedAt: new Date().toISOString(),
            version: payload.version
          }
        }
      };

    } catch (error) {
      console.error('Error handling certificate QR:', error);
      return {
        success: false,
        error: error.message,
        type: 'certificate_handling_error'
      };
    }
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
   * Validate QR payload structure
   * @param {Object} payload - QR payload
   * @returns {Object} Validation result
   */
  validatePayload(payload) {
    try {
      // Check required fields
      const requiredFields = ['type', 'version', 'data', 'urls', 'signature'];
      for (const field of requiredFields) {
        if (!payload[field]) {
          return {
            success: false,
            error: `Missing required field: ${field}`
          };
        }
      }

      // Check version compatibility
      if (payload.version !== '1.0') {
        return {
          success: false,
          error: 'Unsupported QR code version'
        };
      }

      // Check data structure based on type
      const dataValidation = this.validateDataStructure(payload.type, payload.data);
      if (!dataValidation.success) {
        return dataValidation;
      }

      return {
        success: true
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate data structure based on QR type
   * @param {string} type - QR type
   * @param {Object} data - Data to validate
   * @returns {Object} Validation result
   */
  validateDataStructure(type, data) {
    const typeValidations = {
      'batch_tracking': ['batchId', 'produceType', 'farmer', 'harvestDate', 'qualityGrade'],
      'event_tracking': ['batchId', 'eventType', 'actor', 'location', 'timestamp'],
      'certificate_verification': ['certificateId', 'batchId', 'certificateType', 'issuer', 'issueDate']
    };

    const requiredFields = typeValidations[type];
    if (!requiredFields) {
      return {
        success: false,
        error: 'Unknown QR code type'
      };
    }

    for (const field of requiredFields) {
      if (!data[field]) {
        return {
          success: false,
          error: `Missing required data field: ${field}`
        };
      }
    }

    return {
      success: true
    };
  }

  /**
   * Verify QR code signature
   * @param {Object} payload - QR payload
   * @param {string} signature - Signature to verify
   * @returns {boolean} Verification result
   */
  verifySignature(payload, signature) {
    const secret = process.env.QR_SIGNATURE_SECRET || 'default-secret';
    const hash = crypto.createHmac('sha256', secret);
    hash.update(JSON.stringify(payload.data));
    const expectedSignature = hash.digest('hex');
    return expectedSignature === signature;
  }

  /**
   * Fetch batch information from API
   * @param {string} batchId - Batch ID
   * @returns {Object} Batch information
   */
  async fetchBatchInfo(batchId) {
    try {
      // This would make an actual API call
      // For now, return mock data
      return {
        success: true,
        data: {
          batchId,
          produceType: 'Tomatoes',
          farmer: 'John Doe',
          harvestDate: '2023-10-01',
          qualityGrade: 'A',
          status: 'IN_TRANSIT',
          location: 'Farm A, Region X'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Fetch event information from API
   * @param {string} batchId - Batch ID
   * @param {string} eventType - Event type
   * @returns {Object} Event information
   */
  async fetchEventInfo(batchId, eventType) {
    try {
      // This would make an actual API call
      return {
        success: true,
        data: {
          batchId,
          eventType,
          actor: 'Transport Company',
          location: 'Transport Hub',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Fetch certificate information from API
   * @param {string} certificateId - Certificate ID
   * @returns {Object} Certificate information
   */
  async fetchCertificateInfo(certificateId) {
    try {
      // This would make an actual API call
      return {
        success: true,
        data: {
          certificateId,
          batchId: '12345',
          certificateType: 'Organic',
          issuer: 'Certification Body',
          issueDate: '2023-10-01',
          expiryDate: '2024-10-01',
          status: 'valid'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify certificate validity
   * @param {Object} certificate - Certificate data
   * @returns {Object} Verification result
   */
  verifyCertificate(certificate) {
    const now = new Date();
    const expiryDate = new Date(certificate.expiryDate);
    
    const isExpired = now > expiryDate;
    const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    
    return {
      isValid: !isExpired && certificate.status === 'valid',
      isExpired,
      daysUntilExpiry: isExpired ? 0 : daysUntilExpiry,
      status: certificate.status,
      issuer: certificate.issuer
    };
  }

  /**
   * Generate QR code for testing
   * @param {Object} data - Data to encode
   * @returns {Promise<string>} QR code data URL
   */
  async generateTestQR(data) {
    try {
      const qrDataURL = await QRCode.toDataURL(JSON.stringify(data));
      return qrDataURL;
    } catch (error) {
      throw new Error(`Test QR generation failed: ${error.message}`);
    }
  }
}

module.exports = QRScanner;

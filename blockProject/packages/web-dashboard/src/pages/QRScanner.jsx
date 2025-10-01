import React, { useState } from 'react'
import { Scan, Package, AlertCircle, CheckCircle, Clock, MapPin } from 'lucide-react'

const QRScanner = () => {
  const [scannedData, setScannedData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleScan = async (qrData) => {
    setLoading(true)
    setError(null)
    
    try {
      // Simulate API call to fetch batch data
      setTimeout(() => {
        const mockBatchData = {
          batchId: 'BCH001',
          produceType: 'Tomatoes',
          quantity: 1000,
          status: 'IN_TRANSIT',
          harvestDate: '2024-01-15',
          location: 'Transport Hub, California',
          qualityGrade: 'A',
          farmer: 'John Doe',
          events: [
            {
              id: 1,
              type: 'REGISTERED',
              description: 'Batch registered by farmer',
              timestamp: '2024-01-15T10:00:00Z',
              location: 'Farm A, California'
            },
            {
              id: 2,
              type: 'IN_TRANSIT',
              description: 'Batch picked up for transport',
              timestamp: '2024-01-16T08:00:00Z',
              location: 'Transport Hub, California'
            }
          ]
        }
        setScannedData(mockBatchData)
        setLoading(false)
      }, 1000)
    } catch (err) {
      setError('Failed to fetch batch data')
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusClasses = {
      'REGISTERED': 'status-badge status-registered',
      'IN_TRANSIT': 'status-badge status-in-transit',
      'AT_WHOLESALER': 'status-badge status-at-wholesaler',
      'AT_RETAILER': 'status-badge status-at-retailer',
      'SOLD_TO_CONSUMER': 'status-badge status-sold'
    }
    return statusClasses[status] || 'status-badge bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'REGISTERED':
        return <CheckCircle className="h-4 w-4" />
      case 'IN_TRANSIT':
        return <Clock className="h-4 w-4" />
      case 'AT_WHOLESALER':
        return <Package className="h-4 w-4" />
      case 'AT_RETAILER':
        return <Package className="h-4 w-4" />
      case 'SOLD_TO_CONSUMER':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">QR Code Scanner</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Scan QR codes to view complete product information, quality data, and supply chain history.
        </p>
      </div>

      {/* Scanner Section */}
      <div className="card">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Scan className="h-8 w-8 text-primary-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Scan QR Code</h2>
          <p className="text-gray-600 mb-6">
            Point your camera at a QR code to view product information
          </p>
          
          {!scannedData && (
            <button
              onClick={() => handleScan('mock-qr-data')}
              disabled={loading}
              className="btn-primary inline-flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Scanning...
                </>
              ) : (
                <>
                  <Scan className="h-4 w-4 mr-2" />
                  Scan QR Code
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Scanned Data */}
      {scannedData && (
        <div className="space-y-6">
          {/* Batch Information */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Batch Information</h3>
              <span className={getStatusBadge(scannedData.status)}>
                {getStatusIcon(scannedData.status)}
                <span className="ml-1">{scannedData.status.replace('_', ' ')}</span>
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Batch ID</label>
                <p className="text-lg font-semibold text-gray-900">{scannedData.batchId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Produce Type</label>
                <p className="text-lg font-semibold text-gray-900">{scannedData.produceType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Quantity</label>
                <p className="text-lg font-semibold text-gray-900">{scannedData.quantity} kg</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Quality Grade</label>
                <p className="text-lg font-semibold text-gray-900">{scannedData.qualityGrade}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Farmer</label>
                <p className="text-lg font-semibold text-gray-900">{scannedData.farmer}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Harvest Date</label>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(scannedData.harvestDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Current Location */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Location</h3>
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-gray-500" />
              <span className="text-gray-900">{scannedData.location}</span>
            </div>
          </div>

          {/* Supply Chain Events */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Supply Chain History</h3>
            <div className="space-y-4">
              {scannedData.events.map((event, index) => (
                <div key={event.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      {getStatusIcon(event.type)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">
                        {event.type.replace('_', ' ')}
                      </h4>
                      <span className="text-sm text-gray-500">
                        {new Date(event.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">{event.description}</p>
                    <div className="flex items-center space-x-1 mt-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">{event.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              onClick={() => setScannedData(null)}
              className="btn-outline"
            >
              Scan Another
            </button>
            <button className="btn-primary">
              View Full Details
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default QRScanner

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Package, TrendingUp, AlertCircle, CheckCircle, Clock, MapPin } from 'lucide-react'

const Dashboard = () => {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)

  // Mock data for demonstration
  useEffect(() => {
    const mockBatches = [
      {
        id: 1,
        batchId: 'BCH001',
        produceType: 'Tomatoes',
        quantity: 1000,
        status: 'REGISTERED',
        harvestDate: '2024-01-15',
        location: 'Farm A, California',
        qualityGrade: 'A',
        createdAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 2,
        batchId: 'BCH002',
        produceType: 'Wheat',
        quantity: 2000,
        status: 'IN_TRANSIT',
        harvestDate: '2024-01-10',
        location: 'Transport Hub',
        qualityGrade: 'B',
        createdAt: '2024-01-10T08:00:00Z'
      },
      {
        id: 3,
        batchId: 'BCH003',
        produceType: 'Apples',
        quantity: 500,
        status: 'AT_WHOLESALER',
        harvestDate: '2024-01-05',
        location: 'Wholesale Market',
        qualityGrade: 'A',
        createdAt: '2024-01-05T12:00:00Z'
      }
    ]
    
    setTimeout(() => {
      setBatches(mockBatches)
      setLoading(false)
    }, 1000)
  }, [])

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

  const stats = [
    { label: 'Total Batches', value: batches.length, icon: Package, color: 'text-blue-600' },
    { label: 'In Transit', value: batches.filter(b => b.status === 'IN_TRANSIT').length, icon: Clock, color: 'text-yellow-600' },
    { label: 'At Wholesaler', value: batches.filter(b => b.status === 'AT_WHOLESALER').length, icon: Package, color: 'text-orange-600' },
    { label: 'Quality Score', value: '98.5%', icon: TrendingUp, color: 'text-green-600' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your agricultural produce batches</p>
        </div>
        <Link to="/dashboard/new" className="btn-primary inline-flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          New Batch
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-gray-50 ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Batches */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Batches</h2>
          <Link to="/dashboard/batches" className="text-primary-600 hover:text-primary-700 font-medium">
            View All
          </Link>
        </div>

        {batches.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No batches yet</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first batch</p>
            <Link to="/dashboard/new" className="btn-primary">
              Create First Batch
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {batches.map((batch) => (
              <div key={batch.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-primary-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-medium text-gray-900">{batch.batchId}</h3>
                        <span className={getStatusBadge(batch.status)}>
                          {getStatusIcon(batch.status)}
                          <span className="ml-1">{batch.status.replace('_', ' ')}</span>
                        </span>
                      </div>
                      <p className="text-gray-600">{batch.produceType} • {batch.quantity} kg</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{batch.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(batch.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link 
                      to={`/batch/${batch.id}`}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Package className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Register Batch</h3>
          <p className="text-gray-600 mb-4">Create a new batch of produce for tracking</p>
          <Link to="/dashboard/new" className="btn-primary">
            Register Now
          </Link>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">View Analytics</h3>
          <p className="text-gray-600 mb-4">Track performance and quality metrics</p>
          <Link to="/dashboard/analytics" className="btn-outline">
            View Analytics
          </Link>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Quality Reports</h3>
          <p className="text-gray-600 mb-4">Monitor quality and compliance reports</p>
          <Link to="/dashboard/reports" className="btn-outline">
            View Reports
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

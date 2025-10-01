import React from 'react'
import { Link } from 'react-router-dom'
import { Package, Scan, Shield, TrendingUp, ArrowRight, CheckCircle } from 'lucide-react'

const Home = () => {
  const features = [
    {
      icon: Package,
      title: 'Batch Tracking',
      description: 'Track your produce from farm to consumer with complete transparency.'
    },
    {
      icon: Scan,
      title: 'QR Code Scanning',
      description: 'Generate and scan QR codes for instant product information.'
    },
    {
      icon: Shield,
      title: 'Quality Assurance',
      description: 'Ensure product quality with blockchain-verified certifications.'
    },
    {
      icon: TrendingUp,
      title: 'Fair Pricing',
      description: 'Transparent pricing with government-regulated fair price ranges.'
    }
  ]

  const stats = [
    { label: 'Active Batches', value: '1,234' },
    { label: 'Farmers Registered', value: '456' },
    { label: 'Products Tracked', value: '7,890' },
    { label: 'Quality Score', value: '98.5%' }
  ]

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-16 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Blockchain Supply Chain
            <span className="text-primary-600"> for Agriculture</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Track agricultural produce from farm to consumer with complete transparency, 
            quality assurance, and fair pricing using blockchain technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/dashboard" className="btn-primary inline-flex items-center">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link to="/scan" className="btn-outline inline-flex items-center">
              Scan QR Code
              <Scan className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">{stat.value}</div>
            <div className="text-gray-600">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* Features Section */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Key Features</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our platform provides comprehensive tools for supply chain management 
            with blockchain technology.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="card hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4">
                  <Icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-50 rounded-2xl p-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Why Choose Our Platform?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Complete Transparency</h3>
                  <p className="text-gray-600">Every step of the supply chain is recorded on the blockchain.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Quality Assurance</h3>
                  <p className="text-gray-600">Blockchain-verified quality certifications and testing results.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Fair Pricing</h3>
                  <p className="text-gray-600">Government-regulated pricing ensures fair compensation for farmers.</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Real-time Tracking</h3>
                  <p className="text-gray-600">Monitor your produce in real-time with GPS and IoT sensors.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Mobile Access</h3>
                  <p className="text-gray-600">Access the platform from anywhere with our mobile app.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Compliance Ready</h3>
                  <p className="text-gray-600">Built-in compliance with food safety and regulatory standards.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center bg-primary-600 text-white rounded-2xl p-12">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-xl mb-8 opacity-90">
          Join thousands of farmers and consumers using blockchain technology for transparent supply chains.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register" className="bg-white text-primary-600 hover:bg-gray-100 font-medium py-3 px-6 rounded-lg transition-colors duration-200 inline-flex items-center">
            Register Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link to="/login" className="border border-white text-white hover:bg-white hover:text-primary-600 font-medium py-3 px-6 rounded-lg transition-colors duration-200">
            Login
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home

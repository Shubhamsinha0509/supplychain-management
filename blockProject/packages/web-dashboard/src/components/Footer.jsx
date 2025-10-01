import React from 'react'
import { Package, Github, Twitter, Mail } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Package className="h-8 w-8 text-primary-400" />
              <span className="text-xl font-bold">SupplyChain</span>
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              A blockchain-based supply chain application for tracking agricultural produce 
              from farm to consumer, ensuring transparency, quality, and fair pricing.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="/" className="text-gray-400 hover:text-white transition-colors">Home</a></li>
              <li><a href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</a></li>
              <li><a href="/scan" className="text-gray-400 hover:text-white transition-colors">Scan QR</a></li>
              <li><a href="/login" className="text-gray-400 hover:text-white transition-colors">Login</a></li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Features</h3>
            <ul className="space-y-2">
              <li className="text-gray-400">Batch Tracking</li>
              <li className="text-gray-400">QR Code Generation</li>
              <li className="text-gray-400">Quality Monitoring</li>
              <li className="text-gray-400">Fair Pricing</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2024 SupplyChain Blockchain. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

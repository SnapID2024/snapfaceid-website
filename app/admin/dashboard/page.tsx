'use client'

import { useState, useEffect } from 'react'
import { database } from '@/lib/firebase'
import { ref, onValue, off } from 'firebase/database'
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api'
import Link from 'next/link'

interface GuardianAlert {
  id: string
  userId: string
  userName: string
  userPhone: string
  userPhotoUrl: string
  datePhotoUrl: string
  dateName: string
  datePhone: string
  dateLocation: string
  activatedAt: string
  lastCheckIn: string
  status: 'active' | 'no_response' | 'safe' | 'emergency'
  currentLocation: {
    latitude: number
    longitude: number
    timestamp: string
  }
  locationHistory: Array<{
    latitude: number
    longitude: number
    timestamp: string
  }>
}

export default function AdminDashboard() {
  const [alerts, setAlerts] = useState<GuardianAlert[]>([])
  const [selectedAlert, setSelectedAlert] = useState<GuardianAlert | null>(null)
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 }) // NYC default
  const [filter, setFilter] = useState<'all' | 'active' | 'no_response' | 'emergency'>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Listen to Firebase Realtime Database for Guardian alerts
    const alertsRef = ref(database, 'guardian_alerts')

    const unsubscribe = onValue(alertsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const alertsList: GuardianAlert[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }))
        setAlerts(alertsList)

        // Center map on first active alert
        const activeAlert = alertsList.find(a => a.status === 'active' || a.status === 'no_response')
        if (activeAlert) {
          setMapCenter({
            lat: activeAlert.currentLocation.latitude,
            lng: activeAlert.currentLocation.longitude
          })
        }
      }
      setIsLoading(false)
    })

    return () => {
      off(alertsRef)
    }
  }, [])

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true
    return alert.status === filter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'no_response':
        return 'bg-red-500 animate-pulse'
      case 'emergency':
        return 'bg-red-700 animate-pulse'
      case 'safe':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active - Responding'
      case 'no_response':
        return 'NO RESPONSE - ALERT'
      case 'emergency':
        return 'EMERGENCY - INTERVENTION NEEDED'
      case 'safe':
        return 'Date Completed - Safe'
      default:
        return status
    }
  }

  const getTimeSinceLastCheckIn = (timestamp: string) => {
    const now = new Date()
    const lastCheckIn = new Date(timestamp)
    const diffMinutes = Math.floor((now.getTime() - lastCheckIn.getTime()) / 60000)

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes} min ago`
    const hours = Math.floor(diffMinutes / 60)
    return `${hours}h ${diffMinutes % 60}m ago`
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
                S
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Guardian Monitor</h1>
                <p className="text-sm text-gray-600">Real-time Safety Tracking</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">Active Alerts</p>
                <p className="text-2xl font-bold text-primary">
                  {alerts.filter(a => a.status === 'active' || a.status === 'no_response').length}
                </p>
              </div>
              <Link href="/" className="text-gray-700 hover:text-primary transition">
                Exit
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-6">
            {[
              { key: 'all', label: 'All Alerts', count: alerts.length },
              { key: 'active', label: 'Active', count: alerts.filter(a => a.status === 'active').length },
              { key: 'no_response', label: 'No Response', count: alerts.filter(a => a.status === 'no_response').length },
              { key: 'emergency', label: 'Emergency', count: alerts.filter(a => a.status === 'emergency').length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition ${
                  filter === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  filter === tab.key ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Alerts List */}
          <div className="lg:col-span-1 space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading alerts...</p>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-6xl mb-4">✓</div>
                <p className="text-gray-600">No alerts in this category</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className={`bg-white rounded-lg shadow-md p-4 cursor-pointer transition hover:shadow-lg ${
                    selectedAlert?.id === alert.id ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <img
                        src={alert.userPhotoUrl || '/placeholder-user.png'}
                        alt={alert.userName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="font-bold text-gray-900">{alert.userName}</h3>
                        <p className="text-sm text-gray-600">{alert.userPhone}</p>
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(alert.status)}`} />
                  </div>

                  <div className="text-sm space-y-1 mb-3">
                    <p className="text-gray-600">
                      <span className="font-medium">Date with:</span> {alert.dateName}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Location:</span> {alert.dateLocation}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Last check-in:</span>{' '}
                      <span className={alert.status === 'no_response' ? 'text-red-600 font-bold' : ''}>
                        {getTimeSinceLastCheckIn(alert.lastCheckIn)}
                      </span>
                    </p>
                  </div>

                  <div className={`text-xs font-bold py-2 px-3 rounded ${
                    alert.status === 'no_response' || alert.status === 'emergency'
                      ? 'bg-red-100 text-red-800'
                      : alert.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {getStatusText(alert.status)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Map and Details */}
          <div className="lg:col-span-2 space-y-4">
            {/* Map */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height: '500px' }}>
              <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={mapCenter}
                  zoom={13}
                >
                  {filteredAlerts.map((alert) => (
                    <Marker
                      key={alert.id}
                      position={{
                        lat: alert.currentLocation.latitude,
                        lng: alert.currentLocation.longitude
                      }}
                      onClick={() => setSelectedAlert(alert)}
                      icon={{
                        url: alert.status === 'no_response' || alert.status === 'emergency'
                          ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                          : 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                      }}
                    />
                  ))}

                  {selectedAlert && (
                    <InfoWindow
                      position={{
                        lat: selectedAlert.currentLocation.latitude,
                        lng: selectedAlert.currentLocation.longitude
                      }}
                      onCloseClick={() => setSelectedAlert(null)}
                    >
                      <div className="p-2">
                        <h3 className="font-bold mb-1">{selectedAlert.userName}</h3>
                        <p className="text-sm text-gray-600">{getStatusText(selectedAlert.status)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Last update: {getTimeSinceLastCheckIn(selectedAlert.currentLocation.timestamp)}
                        </p>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </LoadScript>
            </div>

            {/* Selected Alert Details */}
            {selectedAlert && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Alert Details</h2>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* User Info */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3">User Information</h3>
                    <div className="flex items-start space-x-3 mb-4">
                      <img
                        src={selectedAlert.userPhotoUrl || '/placeholder-user.png'}
                        alt={selectedAlert.userName}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium">{selectedAlert.userName}</p>
                        <p className="text-sm text-gray-600">{selectedAlert.userPhone}</p>
                        <a
                          href={`tel:${selectedAlert.userPhone}`}
                          className="text-sm text-primary hover:underline"
                        >
                          Call User
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Date Info */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3">Date Information</h3>
                    <div className="flex items-start space-x-3 mb-4">
                      <img
                        src={selectedAlert.datePhotoUrl || '/placeholder-user.png'}
                        alt={selectedAlert.dateName}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium">{selectedAlert.dateName}</p>
                        <p className="text-sm text-gray-600">{selectedAlert.datePhone}</p>
                        <p className="text-sm text-gray-600">{selectedAlert.dateLocation}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="mt-6">
                  <h3 className="font-bold text-gray-900 mb-3">Timeline</h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                      <div>
                        <p className="text-sm font-medium">Guardian Activated</p>
                        <p className="text-xs text-gray-600">{new Date(selectedAlert.activatedAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        selectedAlert.status === 'no_response' ? 'bg-red-500' : 'bg-green-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium">Last Check-in</p>
                        <p className="text-xs text-gray-600">
                          {new Date(selectedAlert.lastCheckIn).toLocaleString()}
                          ({getTimeSinceLastCheckIn(selectedAlert.lastCheckIn)})
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => window.open(`tel:${selectedAlert.userPhone}`)}
                    className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition"
                  >
                    📞 Call User
                  </button>
                  <button
                    onClick={() => {
                      // TODO: Implement emergency services notification
                      alert('Emergency services will be notified')
                    }}
                    className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
                  >
                    🚨 Alert Authorities
                  </button>
                  <button
                    onClick={() => {
                      // TODO: Implement mark as safe
                      alert('Alert marked as safe')
                    }}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                  >
                    ✓ Mark Safe
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

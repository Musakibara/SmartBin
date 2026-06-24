export interface Bin {
    id: string
    name: string
    location: string
    fillLevel: number
    status: 'normal' | 'warning' | 'full'
    lastUpdate: string
    lat: number
    lng: number
    battery: number
    temperature: number
}

export interface Alert {
    id: string
    bin: string
    message: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    status: 'pending' | 'resolved'
    time: string
}

export interface Prediction {
    id: string
    bin: string
    message: string
    estimatedHours: number
    priority: 'low' | 'medium' | 'high'
}

export interface SensorReading {
    time: string
    value: number
}

export type KpiData = {
    totalBins: number
    activeSensors: number
    criticalAlerts: number
    averageFillLevel: number
    predictedOverflows: number
    notificationsSent: number
}

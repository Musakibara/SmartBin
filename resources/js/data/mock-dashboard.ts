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

export const kpiData = {
    totalBins: 24,
    activeSensors: 22,
    criticalAlerts: 3,
    averageFillLevel: 47,
    predictedOverflows: 5,
    notificationsSent: 128,
    collectionEfficiency: 92,
}

export const fillLevelHistory: SensorReading[] = [
    { time: '00:00', value: 30 },
    { time: '04:00', value: 25 },
    { time: '08:00', value: 45 },
    { time: '12:00', value: 72 },
    { time: '16:00', value: 85 },
    { time: '20:00', value: 60 },
]

export const bins: Bin[] = [
    { id: 'BIN-001', name: 'Parc Central', location: 'Av. Charles Atangana', fillLevel: 85, status: 'full', lastUpdate: 'Il y a 2 min', lat: 3.848, lng: 11.502, battery: 42, temperature: 24 },
    { id: 'BIN-002', name: 'Gare SNCF', location: 'Place de la Gare', fillLevel: 62, status: 'warning', lastUpdate: 'Il y a 5 min', lat: 3.851, lng: 11.498, battery: 68, temperature: 26 },
    { id: 'BIN-003', name: 'Mairie', location: 'Rue de la Mairie', fillLevel: 23, status: 'normal', lastUpdate: 'Il y a 1 min', lat: 3.855, lng: 11.505, battery: 89, temperature: 21 },
    { id: 'BIN-004', name: 'Hôpital', location: 'Bd Kennedy', fillLevel: 91, status: 'full', lastUpdate: 'Il y a 3 min', lat: 3.842, lng: 11.51, battery: 35, temperature: 23 },
    { id: 'BIN-005', name: 'École', location: 'Rue des Écoles', fillLevel: 15, status: 'normal', lastUpdate: 'Il y a 4 min', lat: 3.858, lng: 11.495, battery: 95, temperature: 22 },
    { id: 'BIN-006', name: 'Marché', location: 'Place du Marché Central', fillLevel: 74, status: 'warning', lastUpdate: 'Il y a 2 min', lat: 3.845, lng: 11.508, battery: 55, temperature: 28 },
    { id: 'BIN-007', name: 'Bibliothèque', location: "Rue de l'Université", fillLevel: 12, status: 'normal', lastUpdate: 'Il y a 6 min', lat: 3.853, lng: 11.512, battery: 91, temperature: 20 },
    { id: 'BIN-008', name: 'Stade', location: 'Bd du Stade Ahmadou Ahidjo', fillLevel: 45, status: 'normal', lastUpdate: 'Il y a 3 min', lat: 3.838, lng: 11.515, battery: 76, temperature: 25 },
    { id: 'BIN-009', name: 'Musée', location: "Place de l'Indépendance", fillLevel: 33, status: 'normal', lastUpdate: 'Il y a 4 min', lat: 3.86, lng: 11.5, battery: 82, temperature: 22 },
    { id: 'BIN-010', name: 'Commissariat', location: 'Rue de la Sûreté', fillLevel: 18, status: 'normal', lastUpdate: 'Il y a 2 min', lat: 3.846, lng: 11.496, battery: 88, temperature: 23 },
    { id: 'BIN-011', name: 'Piscine', location: 'Bd des Sports', fillLevel: 56, status: 'warning', lastUpdate: 'Il y a 7 min', lat: 3.84, lng: 11.52, battery: 48, temperature: 27 },
    { id: 'BIN-012', name: 'Théâtre', location: 'Rue des Spectacles', fillLevel: 41, status: 'normal', lastUpdate: 'Il y a 5 min', lat: 3.856, lng: 11.488, battery: 64, temperature: 21 },
    { id: 'BIN-013', name: 'Gendarmerie', location: 'Av. de la Sécurité', fillLevel: 88, status: 'full', lastUpdate: 'Il y a 1 min', lat: 3.835, lng: 11.485, battery: 38, temperature: 24 },
    { id: 'BIN-014', name: 'Jardin Public', location: 'Rue des Fleurs', fillLevel: 9, status: 'normal', lastUpdate: 'Il y a 8 min', lat: 3.865, lng: 11.51, battery: 97, temperature: 19 },
    { id: 'BIN-015', name: 'Centre Sportif', location: 'Rue du Stade Annexe', fillLevel: 67, status: 'warning', lastUpdate: 'Il y a 3 min', lat: 3.85, lng: 11.525, battery: 58, temperature: 26 },
    { id: 'BIN-016', name: 'Église', location: 'Place de la Foi', fillLevel: 29, status: 'normal', lastUpdate: 'Il y a 4 min', lat: 3.838, lng: 11.492, battery: 72, temperature: 22 },
    { id: 'BIN-017', name: 'Poste', location: 'Rue des Colis', fillLevel: 53, status: 'warning', lastUpdate: 'Il y a 6 min', lat: 3.862, lng: 11.482, battery: 61, temperature: 23 },
    { id: 'BIN-018', name: 'Pharmacie', location: 'Bd de la Santé', fillLevel: 38, status: 'normal', lastUpdate: 'Il y a 2 min', lat: 3.843, lng: 11.515, battery: 79, temperature: 22 },
    { id: 'BIN-019', name: 'Supermarché', location: 'Av. du Commerce', fillLevel: 95, status: 'full', lastUpdate: 'Il y a 1 min', lat: 3.858, lng: 11.518, battery: 25, temperature: 25 },
    { id: 'BIN-020', name: 'Banque', location: 'Rue des Finances', fillLevel: 20, status: 'normal', lastUpdate: 'Il y a 5 min', lat: 3.84, lng: 11.48, battery: 93, temperature: 21 },
    { id: 'BIN-021', name: 'Centre Commercial', location: 'Place des Affaires', fillLevel: 79, status: 'warning', lastUpdate: 'Il y a 3 min', lat: 3.852, lng: 11.53, battery: 45, temperature: 24 },
    { id: 'BIN-022', name: 'Université', location: 'Rue du Savoir', fillLevel: 47, status: 'normal', lastUpdate: 'Il y a 4 min', lat: 3.868, lng: 11.505, battery: 71, temperature: 22 },
    { id: 'BIN-023', name: 'Hôtel de Ville', location: "Pl. de l'Hôtel de Ville", fillLevel: 71, status: 'warning', lastUpdate: 'Il y a 2 min', lat: 3.848, lng: 11.49, battery: 52, temperature: 23 },
    { id: 'BIN-024', name: 'Centre Culturel', location: 'Rue de la Culture', fillLevel: 36, status: 'normal', lastUpdate: 'Il y a 6 min', lat: 3.835, lng: 11.505, battery: 84, temperature: 21 },
]

export const alerts: Alert[] = [
    { id: 'ALT-001', bin: 'BIN-001', message: 'Benne presque pleine (85%)', severity: 'high', status: 'pending', time: 'Il y a 10 min' },
    { id: 'ALT-002', bin: 'BIN-004', message: 'Benne critique (91%)', severity: 'critical', status: 'pending', time: 'Il y a 15 min' },
    { id: 'ALT-003', bin: 'BIN-002', message: 'Seuil d\'alerte atteint (62%)', severity: 'medium', status: 'pending', time: 'Il y a 20 min' },
    { id: 'ALT-004', bin: 'BIN-006', message: 'Niveau d\'alerte (74%)', severity: 'medium', status: 'resolved', time: 'Il y a 1h' },
    { id: 'ALT-005', bin: 'BIN-003', message: 'Capteur inactif', severity: 'low', status: 'resolved', time: 'Il y a 2h' },
]

export const predictions: Prediction[] = [
    { id: 'PRD-001', bin: 'BIN-001', message: 'Sera pleine dans environ 2 heures', estimatedHours: 2, priority: 'high' },
    { id: 'PRD-002', bin: 'BIN-004', message: 'Sera pleine dans environ 1 heure', estimatedHours: 1, priority: 'high' },
    { id: 'PRD-003', bin: 'BIN-006', message: 'Sera pleine dans environ 4 heures', estimatedHours: 4, priority: 'medium' },
    { id: 'PRD-004', bin: 'BIN-002', message: 'Sera pleine dans environ 5 heures', estimatedHours: 5, priority: 'medium' },
    { id: 'PRD-005', bin: 'BIN-005', message: 'Sera pleine dans environ 12 heures', estimatedHours: 12, priority: 'low' },
]

export const activityTimeline = [
    { action: 'Alerte résolue', detail: 'BIN-003 - Capteur inactif', time: 'Il y a 2h' },
    { action: 'Notification envoyée', detail: 'Agent municipal alerté pour BIN-004', time: 'Il y a 15 min' },
    { action: 'Nouvelle alerte', detail: 'BIN-001 - Seuil critique atteint', time: 'Il y a 10 min' },
    { action: 'Lecture capteur', detail: 'BIN-005 - Niveau mis à jour: 15%', time: 'Il y a 4 min' },
    { action: 'Prédiction générée', detail: 'BIN-004 - Débordement estimé dans 1h', time: 'Il y a 5 min' },
]

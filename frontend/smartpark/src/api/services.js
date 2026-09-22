import { api } from './client';

/* Endpoint map mirrors the verified Spring Boot controllers exactly:
   AuthController        /api/auth/signup, /api/auth/login
   UserController        /api/users
   VehicleController     /api/vehicles (+ /{id})
   ParkingLotController  /api/parking-lots
   ParkingSlotController /api/parking-slots/{lotId|lot/{lotId}|lot/{lotId}/available|generate/{lotId}}
   ParkingSessionController /api/parking-sessions/check-in, /{sessionId}/check-out, GET /
*/

export const authService = {
  signup: (payload) =>
    api.post('/api/auth/signup', payload, { auth: false }),
  login: (payload) =>
    api.post('/api/auth/login', payload, { auth: false }),
};

export const userService = {
  list: () => api.get('/api/users'),
};

export const vehicleService = {
  list: () => api.get('/api/vehicles'),
  create: (payload) => api.post('/api/vehicles', payload),
  update: (id, payload) => api.put(`/api/vehicles/${id}`, payload),
  remove: (id) => api.delete(`/api/vehicles/${id}`),
};

export const parkingLotService = {
  list: () => api.get('/api/parking-lots'),
  create: (payload) => api.post('/api/parking-lots', payload),
};

export const parkingSlotService = {
  byLot: (lotId) => api.get(`/api/parking-slots/lot/${lotId}`),
  available: (lotId) =>
    api.get(`/api/parking-slots/lot/${lotId}/available`),
  create: (lotId, payload) =>
    api.post(`/api/parking-slots/${lotId}`, payload),
  generate: (lotId) => api.post(`/api/parking-slots/generate/${lotId}`, {}),
};

export const parkingSessionService = {
  history: () => api.get('/api/parking-sessions'),
  checkIn: (vehicleId, parkingSlotId) =>
    api.post('/api/parking-sessions/check-in', { vehicleId, parkingSlotId }),
  checkOut: (sessionId) =>
    api.post(`/api/parking-sessions/${sessionId}/check-out`, {}),
};

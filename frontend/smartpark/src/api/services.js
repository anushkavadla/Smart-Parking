import { api } from './client';

/* Endpoint map mirrors the verified Spring Boot controllers exactly:
   AuthController        /api/auth/signup, /api/auth/login
   UserController        /api/users
   VehicleController     /api/vehicles (+ /{id})
   ParkingLotController  /api/parking-lots
   ParkingLevelController /api/parking-levels (+ /{levelCode})
   ParkingSlotController /api/parking-slots/{lotId|lot/{lotId}|lot/{lotId}/available|generate/{lotId}}
                         /api/parking-slots/level/{levelCode}
                         /api/parking-slots/availability
                         /api/parking-slots/find?vehicleType&levelCode
                         PUT /api/parking-slots/{slotId}/status?status (admin)
   ReservationController POST /api/reservations, GET /api/reservations,
                         POST /api/reservations/{id}/cancel
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

export const parkingLevelService = {
  list: () => api.get('/api/parking-levels'),
  get: (levelCode) => api.get(`/api/parking-levels/${levelCode}`),
  create: (payload) => api.post('/api/parking-levels', payload),
};

export const parkingSlotService = {
  byLot: (lotId) => api.get(`/api/parking-slots/lot/${lotId}`),
  available: (lotId) =>
    api.get(`/api/parking-slots/lot/${lotId}/available`),
  create: (lotId, payload) =>
    api.post(`/api/parking-slots/${lotId}`, payload),
  generate: (lotId) => api.post(`/api/parking-slots/generate/${lotId}`, {}),
  byLevel: (levelCode) => api.get(`/api/parking-slots/level/${levelCode}`),
  availability: () => api.get('/api/parking-slots/availability'),
  find: (vehicleType, levelCode) => {
    const qs = new URLSearchParams({ vehicleType });
    if (levelCode && levelCode !== 'ANY') qs.set('levelCode', levelCode);
    return api.get(`/api/parking-slots/find?${qs.toString()}`);
  },
  updateStatus: (slotId, status) =>
    api.put(
      `/api/parking-slots/${slotId}/status?status=${encodeURIComponent(status)}`,
      null,
    ),
};

export const reservationService = {
  list: () => api.get('/api/reservations'),
  create: (payload) => api.post('/api/reservations', payload),
  cancel: (id) => api.post(`/api/reservations/${id}/cancel`, {}),
};

export const parkingSessionService = {
  history: () => api.get('/api/parking-sessions'),
  checkIn: (vehicleId, parkingSlotId) =>
    api.post('/api/parking-sessions/check-in', { vehicleId, parkingSlotId }),
  // payment = { paymentMethod: 'UPI'|'CARD'|'CASH', paymentReference? }.
  // The server validates payment BEFORE completing anything: a rejected
  // payment leaves the session ACTIVE and the bay OCCUPIED.
  checkOut: (sessionId, payment) =>
    api.post(`/api/parking-sessions/${sessionId}/check-out`, payment ?? {}),
};

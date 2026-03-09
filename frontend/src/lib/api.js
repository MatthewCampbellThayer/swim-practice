const BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('swim_token');
}

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  auth: {
    sendOtp: (cell) => req('POST', '/auth/send-otp', { cell }),
    verifyOtp: (cell, code) => req('POST', '/auth/verify-otp', { cell, code }),
  },
  clubs: {
    mine: () => req('GET', '/clubs'),
    all: () => req('GET', '/clubs/all'),
    create: (data) => req('POST', '/clubs', data),
    update: (id, data) => req('PUT', `/clubs/${id}`, data),
    delete: (id) => req('DELETE', `/clubs/${id}`),
  },
  coaches: {
    list: () => req('GET', '/coaches'),
    create: (data) => req('POST', '/coaches', data),
    update: (id, data) => req('PUT', `/coaches/${id}`, data),
    delete: (id) => req('DELETE', `/coaches/${id}`),
  },
  swimmers: {
    list: (club_id) => req('GET', `/swimmers${club_id ? `?club_id=${club_id}` : ''}`),
    create: (data) => req('POST', '/swimmers', data),
    addGuest: (data) => req('POST', '/swimmers/guest', data),
    update: (id, data) => req('PUT', `/swimmers/${id}`, data),
    delete: (id) => req('DELETE', `/swimmers/${id}`),
  },
  workouts: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return req('GET', `/workouts${qs ? `?${qs}` : ''}`);
    },
    get: (id) => req('GET', `/workouts/${id}`),
    create: (data) => req('POST', '/workouts', data),
    update: (id, data) => req('PUT', `/workouts/${id}`, data),
    delete: (id) => req('DELETE', `/workouts/${id}`),
  },
  attendance: {
    list: (workout_id) => req('GET', `/attendance/${workout_id}`),
    toggle: (workout_id, swimmer_id, attended) =>
      req('POST', `/attendance/${workout_id}/toggle`, { swimmer_id, attended }),
    stats: (swimmer_id) => req('GET', `/attendance/swimmer/${swimmer_id}/stats`),
  },
};

const API_BASE_URL = 'http://localhost:3000/api'

const toApiError = async (response) => {
  let message = 'Request failed.'
  let code = 'INTERNAL_SERVER_ERROR'

  try {
    const body = await response.json()
    if (body?.error?.message) message = body.error.message
    if (body?.error?.code) code = body.error.code
  } catch {
    // Ignore parse errors and use defaults.
  }

  const error = new Error(message)
  error.code = code
  throw error
}

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, options)

  if (!response.ok) {
    return toApiError(response)
  }

  // Success envelope format: { data: ... }
  const body = await response.json()
  return body?.data
}

export const api = {
  getStaff: () => request('/staff'),
  getRoleLimits: () => request('/staff/role-limits'),
  getRoleCooldowns: () => request('/staff/role-cooldowns'),
  getCooldown: () => request('/settings/cooldown'),
  updateRoleLimit: (roleName, annualLimit) =>
    request(`/staff/role-limits/${encodeURIComponent(roleName)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ annualLimit }),
    }),
  updateRoleCooldown: (roleName, cooldownDays) =>
    request(`/staff/role-cooldowns/${encodeURIComponent(roleName)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cooldownDays }),
    }),
  updateCooldown: (cooldownDays) =>
    request('/settings/cooldown', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cooldownDays }),
    }),
  getUniformItems: () => request('/uniform-items'),
  getRequests: ({ status, staffId, storeId } = {}) => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (staffId) params.set('staffId', staffId)
    if (storeId) params.set('storeId', storeId)
    const query = params.toString() ? `?${params.toString()}` : ''
    return request(`/requests${query}`)
  },
  getRequestById: (id) => request(`/requests/${id}`),
  createRequest: (payload) =>
    request('/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  updateRequest: (id, payload) =>
    request(`/requests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  deleteRequest: (id) =>
    request(`/requests/${id}`, {
      method: 'DELETE',
    }),
  updateRequestStatus: (id, status) =>
    request(`/requests/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }),
  importCsv: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return request('/imports', {
      method: 'POST',
      body: formData,
    })
  },
  getImportSummary: (id) => request(`/imports/${id}`),
}

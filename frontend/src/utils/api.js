import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code !== 200) {
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

export const authApi = {
  login: (data) => api.post('/login', data),
  register: (data) => api.post('/register', data),
  getUserInfo: () => api.get('/user/info'),
  updateUserInfo: (data) => api.put('/user/info', data),
  changePassword: (data) => api.post('/user/change-password', data),
}

export const categoryApi = {
  getList: (params) => api.get('/categories', { params }),
  getAdminList: (params) => api.get('/admin/categories', { params }),
  getDetail: (id) => api.get(`/admin/categories/${id}`),
  create: (data) => api.post('/admin/categories', data),
  update: (id, data) => api.put(`/admin/categories/${id}`, data),
  delete: (id) => api.delete(`/admin/categories/${id}`),
}

export const newspaperApi = {
  getList: (params) => api.get('/newspapers', { params }),
  getAdminList: (params) => api.get('/admin/newspapers', { params }),
  getDetail: (id) => api.get(`/newspapers/${id}`),
  getSalesRanking: (params) => api.get('/newspapers/sales/ranking', { params }),
  create: (data) => api.post('/admin/newspapers', data),
  update: (id, data) => api.put(`/admin/newspapers/${id}`, data),
  delete: (id) => api.delete(`/admin/newspapers/${id}`),
}

export const cartApi = {
  getList: () => api.get('/user/cart'),
  add: (data) => api.post('/user/cart', data),
  update: (id, data) => api.put(`/user/cart/${id}`, data),
  remove: (id) => api.delete(`/user/cart/${id}`),
  clear: () => api.delete('/user/cart'),
}

export const orderApi = {
  create: (data) => api.post('/user/orders', data),
  getList: (params) => api.get('/user/orders', { params }),
  getAdminList: (params) => api.get('/admin/orders', { params }),
  getDetail: (id) => api.get(`/user/orders/${id}`),
  getAdminDetail: (id) => api.get(`/admin/orders/${id}`),
  cancel: (id) => api.put(`/user/orders/${id}/cancel`),
  complete: (id) => api.put(`/user/orders/${id}/complete`),
  ship: (id) => api.put(`/admin/orders/${id}/ship`),
  delete: (id) => api.delete(`/admin/orders/${id}`),
}

export const reviewApi = {
  getList: (params) => api.get('/reviews', { params }),
  getAdminList: (params) => api.get('/admin/reviews', { params }),
  create: (data) => api.post('/user/reviews', data),
  delete: (id) => api.delete(`/admin/reviews/${id}`),
}

export const userAdminApi = {
  getList: (params) => api.get('/admin/users', { params }),
  getDetail: (id) => api.get(`/admin/users/${id}`),
  enable: (id) => api.put(`/admin/users/${id}/enable`),
  disable: (id) => api.put(`/admin/users/${id}/disable`),
  delete: (id) => api.delete(`/admin/users/${id}`),
}

export const statsApi = {
  getSalesStats: (params) => api.get('/admin/stats/sales', { params }),
}

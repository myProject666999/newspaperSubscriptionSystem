export const getOrderStatus = (status) => {
  const statusMap = {
    0: { text: '待付款', color: 'warning' },
    1: { text: '已付款', color: 'processing' },
    2: { text: '已发货', color: 'blue' },
    3: { text: '已完成', color: 'success' },
    4: { text: '已取消', color: 'default' },
  }
  return statusMap[status] || { text: '未知', color: 'default' }
}

export const getSubscribeTypeText = (type) => {
  const typeMap = {
    month: '月订',
    quarter: '季订',
    year: '年订',
  }
  return typeMap[type] || type
}

export const getSubscribePrice = (newspaper, type) => {
  const priceMap = {
    month: newspaper.month_price,
    quarter: newspaper.quarter_price,
    year: newspaper.year_price,
  }
  return priceMap[type] || newspaper.price
}

export const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatMoney = (amount) => {
  if (amount === null || amount === undefined) return '0.00'
  return Number(amount).toFixed(2)
}

export const getCurrentUser = () => {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}

export const isLoggedIn = () => {
  return !!localStorage.getItem('token')
}

export const isAdmin = () => {
  const user = getCurrentUser()
  return user?.role === 'admin'
}

export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export const saveAuth = (token, user) => {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
}

import React from 'react'
import { Layout, Menu, theme } from 'antd'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  DashboardOutlined,
  UserOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  CommentOutlined,
  BarChartOutlined,
  LogoutOutlined,
  BookOutlined,
} from '@ant-design/icons'

const { Header, Sider, Content } = Layout

const AdminLayout = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const menuItems = [
    {
      key: '/admin/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/admin/dashboard">工作台</Link>,
    },
    {
      key: '/admin/users',
      icon: <UserOutlined />,
      label: <Link to="/admin/users">用户管理</Link>,
    },
    {
      key: '/admin/categories',
      icon: <AppstoreOutlined />,
      label: <Link to="/admin/categories">分类管理</Link>,
    },
    {
      key: '/admin/newspapers',
      icon: <BookOutlined />,
      label: <Link to="/admin/newspapers">报刊管理</Link>,
    },
    {
      key: '/admin/orders',
      icon: <FileTextOutlined />,
      label: <Link to="/admin/orders">订单管理</Link>,
    },
    {
      key: '/admin/reviews',
      icon: <CommentOutlined />,
      label: <Link to="/admin/reviews">评价管理</Link>,
    },
    {
      key: '/admin/stats',
      icon: <BarChartOutlined />,
      label: <Link to="/admin/stats">数据统计</Link>,
    },
  ]

  return (
    <Layout className="admin-layout">
      <Sider
        width={200}
        style={{
          background: colorBgContainer,
        }}
      >
        <div className="admin-logo">报刊管理后台</div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          style={{
            height: '100%',
            borderRight: 0,
          }}
          items={menuItems}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 'bold' }}>报刊征订管理系统</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span>欢迎，{user?.nickname || user?.username}</span>
            <a onClick={handleLogout} style={{ cursor: 'pointer' }}>
              <LogoutOutlined /> 退出
            </a>
            <Link to="/" target="_blank">
              前台首页
            </Link>
          </div>
        </Header>

        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default AdminLayout

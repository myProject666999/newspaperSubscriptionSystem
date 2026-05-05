import React, { useState, useEffect } from 'react'
import { Layout, Menu, Dropdown, Avatar, Badge, Button, Input } from 'antd'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  HomeOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  LogoutOutlined,
  LoginOutlined,
  AppstoreOutlined,
  SearchOutlined,
  SettingOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { categoryApi, cartApi } from '../utils/api'

const { Header, Content, Footer } = Layout

const UserLayout = () => {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [categories, setCategories] = useState([])
  const [cartCount, setCartCount] = useState(0)
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    if (user) {
      loadCartCount()
    }
  }, [user])

  const loadCategories = async () => {
    try {
      const res = await categoryApi.getList({ status: 1 })
      setCategories(res.data || [])
    } catch (error) {
      console.error('加载分类失败:', error)
    }
  }

  const loadCartCount = async () => {
    try {
      const res = await cartApi.getList()
      setCartCount(res.data?.list?.length || 0)
    } catch (error) {
      console.error('加载购物车数量失败:', error)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSearch = () => {
    if (searchText.trim()) {
      navigate(`/newspapers?keyword=${encodeURIComponent(searchText)}`)
    }
  }

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        <Link to="/profile">个人中心</Link>
      </Menu.Item>
      <Menu.Item key="orders" icon={<FileTextOutlined />}>
        <Link to="/orders">我的订单</Link>
      </Menu.Item>
      {isAdmin && (
        <Menu.Item key="admin" icon={<SettingOutlined />}>
          <Link to="/admin/dashboard">管理后台</Link>
        </Menu.Item>
      )}
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        退出登录
      </Menu.Item>
    </Menu>
  )

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">首页</Link>,
    },
    {
      key: '/newspapers',
      icon: <AppstoreOutlined />,
      label: (
        <Dropdown
          overlay={
            <Menu>
              {categories.map((cat) => (
                <Menu.Item key={cat.id}>
                  <Link to={`/newspapers?category_id=${cat.id}`}>{cat.name}</Link>
                </Menu.Item>
              ))}
              <Menu.Divider />
              <Menu.Item key="all">
                <Link to="/newspapers">全部报刊</Link>
              </Menu.Item>
            </Menu>
          }
          placement="bottom"
        >
          <span>报刊分类</span>
        </Dropdown>
      ),
    },
    {
      key: '/cart',
      icon: (
        <Badge count={cartCount} showZero>
          <ShoppingCartOutlined />
        </Badge>
      ),
      label: <Link to="/cart">购物车</Link>,
    },
  ]

  return (
    <Layout className="layout-container">
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '0 50px',
          height: 64,
          lineHeight: '64px',
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: '#1890ff',
            marginRight: 30,
          }}
        >
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            报刊征订系统
          </Link>
        </div>

        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{
            flex: 1,
            borderBottom: 'none',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Input.Search
            placeholder="搜索报刊"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
            style={{ width: 200 }}
          />

          {user ? (
            <Dropdown overlay={userMenu}>
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Avatar icon={<UserOutlined />} src={user.avatar} />
                <span style={{ marginLeft: 8 }}>{user.nickname || user.username}</span>
              </div>
            </Dropdown>
          ) : (
            <Button type="primary" icon={<LoginOutlined />}>
              <Link to="/login" style={{ color: '#fff' }}>登录</Link>
            </Button>
          )}
        </div>
      </Header>

      <Content style={{ padding: '24px 50px', minHeight: 'calc(100vh - 130px)' }}>
        <Outlet />
      </Content>

      <Footer style={{ textAlign: 'center', background: '#fff' }}>
        报刊征订系统 ©2024 Created with React + Gin
      </Footer>
    </Layout>
  )
}

export default UserLayout

import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, List, Avatar, Tag, message } from 'antd'
import {
  UserOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  MoneyCollectOutlined,
} from '@ant-design/icons'
import { newspaperApi, orderApi, userAdminApi } from '../../utils/api'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalAmount: 0,
    totalNewspapers: 0,
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [usersRes, ordersRes, newspapersRes] = await Promise.all([
        userAdminApi.getList({ page: 1, page_size: 1 }),
        orderApi.getAdminList({ page: 1, page_size: 5 }),
        newspaperApi.getAdminList({ page: 1, page_size: 1 }),
      ])

      let totalAmount = 0
      const orderList = ordersRes.data?.list || []
      orderList.forEach((order) => {
        if (order.status !== 4) {
          totalAmount += order.total_amount || 0
        }
      })

      setStats({
        totalUsers: usersRes.data?.total || 0,
        totalOrders: ordersRes.data?.total || 0,
        totalAmount,
        totalNewspapers: newspapersRes.data?.total || 0,
      })
      setRecentOrders(orderList)
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const getOrderStatusColor = (status) => {
    const colors = ['warning', 'processing', 'blue', 'success', 'default']
    return colors[status] || 'default'
  }

  const getOrderStatusText = (status) => {
    const texts = ['待付款', '已付款', '已发货', '已完成', '已取消']
    return texts[status] || '未知'
  }

  const formatMoney = (amount) => {
    return Number(amount || 0).toFixed(2)
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="注册用户数"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="订单总数"
              value={stats.totalOrders}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="销售金额"
              value={stats.totalAmount}
              prefix={<MoneyCollectOutlined />}
              suffix="元"
              valueStyle={{ color: '#ff4d4f' }}
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="报刊总数"
              value={stats.totalNewspapers}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="最近订单" loading={loading}>
            <List
              dataSource={recentOrders}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<FileTextOutlined />} />}
                    title={
                      <div>
                        <span>{item.order_no}</span>
                        <Tag className="order-status-tag" color={getOrderStatusColor(item.status)}>
                          {getOrderStatusText(item.status)}
                        </Tag>
                      </div>
                    }
                    description={
                      <div>
                        <span>{item.user?.nickname || item.user?.username}</span>
                        <span style={{ marginLeft: 16 }}>¥{formatMoney(item.total_amount)}</span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="系统说明">
            <div style={{ lineHeight: 2 }}>
              <p>欢迎使用报刊征订管理系统！</p>
              <p>主要功能模块：</p>
              <ul style={{ paddingLeft: 20 }}>
                <li><b>用户管理</b>：查看和管理注册用户，支持启用/停用用户</li>
                <li><b>分类管理</b>：管理报刊分类信息</li>
                <li><b>报刊管理</b>：管理报刊信息，支持增删改查</li>
                <li><b>订单管理</b>：查看和处理用户订单，支持发货操作</li>
                <li><b>评价管理</b>：查看和删除用户评价</li>
                <li><b>数据统计</b>：查看销售数据统计报表</li>
              </ul>
              <p style={{ marginTop: 16 }}>
                技术栈：Gin + React + Ant Design
              </p>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard

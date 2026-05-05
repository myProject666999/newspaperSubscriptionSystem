import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Tag, Button, Space, message, Spin, Divider, Image, Empty } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { orderApi } from '../utils/api'
import { formatMoney, formatDate, getOrderStatus, getSubscribeTypeText } from '../utils/utils'

const OrderDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [orderData, setOrderData] = useState(null)

  useEffect(() => {
    if (id) {
      loadOrderDetail(id)
    }
  }, [id])

  const loadOrderDetail = async (orderId) => {
    setLoading(true)
    try {
      const res = await orderApi.getDetail(orderId)
      setOrderData(res.data)
    } catch (error) {
      message.error('加载订单详情失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async (orderId) => {
    try {
      await orderApi.cancel(orderId)
      message.success('订单已取消')
      loadOrderDetail(orderId)
    } catch (error) {
      message.error('取消失败')
    }
  }

  const handleCompleteOrder = async (orderId) => {
    try {
      await orderApi.complete(orderId)
      message.success('已确认收货')
      loadOrderDetail(orderId)
    } catch (error) {
      message.error('操作失败')
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!orderData) {
    return (
      <Empty description="订单不存在" style={{ padding: 60 }}>
        <Button type="primary" onClick={() => navigate('/orders')}>
          返回订单列表
        </Button>
      </Empty>
    )
  }

  const order = orderData.order || orderData
  const items = orderData.items || []
  const statusInfo = getOrderStatus(order.status)

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/orders')}
        >
          返回订单列表
        </Button>
      </div>

      <Card
        title="订单详情"
        extra={
          <Tag color={statusInfo.color} style={{ fontSize: 16, padding: '4px 12px' }}>
            {statusInfo.text}
          </Tag>
        }
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="订单编号">{order.order_no}</Descriptions.Item>
          <Descriptions.Item label="订单状态">
            <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="订单金额">
            <span className="price-tag" style={{ fontSize: 18 }}>¥{formatMoney(order.total_amount)}</span>
          </Descriptions.Item>
          <Descriptions.Item label="收货人">{order.receiver}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{order.phone}</Descriptions.Item>
          <Descriptions.Item label="收货地址">{order.address}</Descriptions.Item>
          <Descriptions.Item label="下单时间">{formatDate(order.created_at)}</Descriptions.Item>
          <Descriptions.Item label="支付时间">{formatDate(order.pay_time) || '-'}</Descriptions.Item>
        </Descriptions>

        <Divider>订单商品</Divider>

        {items.map((item, index) => (
          <Card key={index} size="small" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <Image
                width={100}
                height={100}
                src={item.newspaper?.image || 'https://picsum.photos/100/100?random=' + item.id}
                style={{ objectFit: 'cover' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>
                  {item.newspaper?.title}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Tag>{getSubscribeTypeText(item.subscribe_type)}</Tag>
                  <span style={{ marginLeft: 16 }}>数量：{item.quantity}</span>
                </div>
                <div className="price-tag" style={{ fontSize: 16 }}>
                  ¥{formatMoney(item.price * item.quantity)}
                </div>
              </div>
            </div>
          </Card>
        ))}

        <Divider>操作</Divider>

        <div style={{ display: 'flex', gap: 12 }}>
          {order.status === 1 && (
            <Space>
              <Button danger onClick={() => handleCancelOrder(order.id)}>
                取消订单
              </Button>
            </Space>
          )}
          {order.status === 2 && (
            <Button type="primary" onClick={() => handleCompleteOrder(order.id)}>
              确认收货
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

export default OrderDetail

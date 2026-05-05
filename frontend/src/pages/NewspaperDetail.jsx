import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Button, Radio, Input, InputNumber, message, Descriptions, Tag, Tabs, List, Avatar, Rate, Divider, Empty } from 'antd'
import { ShoppingCartOutlined, ShoppingOutlined, StarOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { newspaperApi, cartApi, reviewApi } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import { formatMoney, formatDate, getSubscribePrice } from '../utils/utils'

const { TextArea } = Input
const { TabPane } = Tabs

const NewspaperDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [newspaper, setNewspaper] = useState(null)
  const [loading, setLoading] = useState(false)
  const [subscribeType, setSubscribeType] = useState('month')
  const [quantity, setQuantity] = useState(1)
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)

  useEffect(() => {
    if (id) {
      loadNewspaperDetail()
      loadReviews()
    }
  }, [id])

  const loadNewspaperDetail = async () => {
    setLoading(true)
    try {
      const res = await newspaperApi.getDetail(id)
      setNewspaper(res.data)
    } catch (error) {
      message.error('加载报刊详情失败')
    } finally {
      setLoading(false)
    }
  }

  const loadReviews = async () => {
    setReviewsLoading(true)
    try {
      const res = await reviewApi.getList({ newspaper_id: id, page: 1, page_size: 10 })
      setReviews(res.data?.list || [])
    } catch (error) {
      console.error('加载评价失败:', error)
    } finally {
      setReviewsLoading(false)
    }
  }

  const getCurrentPrice = () => {
    if (!newspaper) return 0
    return getSubscribePrice(newspaper, subscribeType)
  }

  const handleAddToCart = async () => {
    if (!user) {
      message.info('请先登录')
      navigate('/login')
      return
    }

    try {
      await cartApi.add({
        newspaper_id: newspaper.id,
        quantity,
        subscribe_type: subscribeType,
      })
      message.success('已加入购物车')
    } catch (error) {
      message.error(error.message || '添加失败')
    }
  }

  const subscribeTypeOptions = [
    { value: 'month', label: '月订', price: newspaper?.month_price },
    { value: 'quarter', label: '季订', price: newspaper?.quarter_price },
    { value: 'year', label: '年订', price: newspaper?.year_price },
  ]

  if (loading || !newspaper) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        加载中...
      </div>
    )
  }

  return (
    <div className="detail-container">
      <Card>
        <Row gutter={32}>
          <Col xs={24} md={10}>
            <img
              alt={newspaper.title}
              src={newspaper.image || 'https://picsum.photos/400/300?random=' + newspaper.id}
              className="detail-image"
            />
          </Col>
          <Col xs={24} md={14} className="detail-info">
            <h1 className="detail-title">{newspaper.title}</h1>
            <div style={{ marginBottom: 16 }}>
              <Tag color="blue">{newspaper.category?.name || '未分类'}</Tag>
              <Tag color="green">销量 {newspaper.sales}</Tag>
            </div>

            <div style={{ marginBottom: 24 }}>
              <span className="detail-price">¥{formatMoney(getCurrentPrice())}</span>
              <span className="detail-price-unit"> / {subscribeType === 'month' ? '月' : subscribeType === 'quarter' ? '季' : '年'}</span>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ marginBottom: 12, color: '#666' }}>订阅类型：</div>
              <Radio.Group
                value={subscribeType}
                onChange={(e) => setSubscribeType(e.target.value)}
                buttonStyle="solid"
              >
                {subscribeTypeOptions.map((opt) => (
                  <Radio.Button key={opt.value} value={opt.value}>
                    {opt.label} ¥{formatMoney(opt.price)}
                  </Radio.Button>
                ))}
              </Radio.Group>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ marginBottom: 12, color: '#666' }}>数量：</div>
              <InputNumber
                min={1}
                max={99}
                value={quantity}
                onChange={setQuantity}
                size="large"
              />
            </div>

            <div style={{ marginBottom: 24, color: '#999' }}>
              小计：<span style={{ color: '#ff4d4f', fontSize: 24, fontWeight: 'bold' }}>
                ¥{formatMoney(getCurrentPrice() * quantity)}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <Button
                type="default"
                size="large"
                icon={<ShoppingCartOutlined />}
                onClick={handleAddToCart}
              >
                加入购物车
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<ShoppingOutlined />}
                onClick={async () => {
                  await handleAddToCart()
                  navigate('/cart')
                }}
              >
                立即购买
              </Button>
            </div>
          </Col>
        </Row>

        <Divider />

        <Tabs defaultActiveKey="description">
          <TabPane tab="商品详情" key="description">
            <Descriptions column={2}>
              <Descriptions.Item label="报刊名称">{newspaper.title}</Descriptions.Item>
              <Descriptions.Item label="所属分类">{newspaper.category?.name || '未分类'}</Descriptions.Item>
              <Descriptions.Item label="单期价格">¥{formatMoney(newspaper.price)}</Descriptions.Item>
              <Descriptions.Item label="月订价格">¥{formatMoney(newspaper.month_price)}</Descriptions.Item>
              <Descriptions.Item label="季订价格">¥{formatMoney(newspaper.quarter_price)}</Descriptions.Item>
              <Descriptions.Item label="年订价格">¥{formatMoney(newspaper.year_price)}</Descriptions.Item>
            </Descriptions>
            {newspaper.description && (
              <div style={{ marginTop: 24 }}>
                <h4>详细描述：</h4>
                <p style={{ color: '#666', lineHeight: 1.8 }}>{newspaper.description}</p>
              </div>
            )}
          </TabPane>

          <TabPane tab={`用户评价 (${reviews.length})`} key="reviews">
            {reviews.length > 0 ? (
              <List
                loading={reviewsLoading}
                itemLayout="horizontal"
                dataSource={reviews}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar>{item.user?.nickname?.[0] || item.user?.username?.[0]}</Avatar>}
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span>{item.user?.nickname || item.user?.username}</span>
                          <Rate disabled value={item.rating} />
                          <span style={{ color: '#999', fontSize: 12 }}>{formatDate(item.created_at)}</span>
                        </div>
                      }
                      description={
                        <div style={{ color: '#333' }}>
                          <p>{item.content}</p>
                          {item.images && (
                            <div style={{ marginTop: 8 }}>
                              {item.images.split(',').map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt=""
                                  style={{ width: 80, height: 80, objectFit: 'cover', marginRight: 8, borderRadius: 4 }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无评价" />
            )}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export default NewspaperDetail

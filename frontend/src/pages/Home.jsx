import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Carousel, Input, Button, Tag, message } from 'antd'
import { SearchOutlined, ShoppingCartOutlined, FireOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import { newspaperApi, categoryApi } from '../utils/api'
import { formatMoney, getSubscribeTypeText } from '../utils/utils'

const { Meta } = Card

const Home = () => {
  const navigate = useNavigate()
  const [newspapers, setNewspapers] = useState([])
  const [categories, setCategories] = useState([])
  const [salesRanking, setSalesRanking] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [newspaperRes, categoryRes, rankingRes] = await Promise.all([
        newspaperApi.getList({ page: 1, page_size: 8 }),
        categoryApi.getList({ status: 1 }),
        newspaperApi.getSalesRanking({ limit: 10 }),
      ])
      setNewspapers(newspaperRes.data?.list || [])
      setCategories(categoryRes.data || [])
      setSalesRanking(rankingRes.data || [])
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    if (searchText.trim()) {
      navigate(`/newspapers?keyword=${encodeURIComponent(searchText)}`)
    }
  }

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId)
    if (categoryId) {
      navigate(`/newspapers?category_id=${categoryId}`)
    }
  }

  const carouselItems = [
    {
      key: 1,
      title: '欢迎来到报刊征订系统',
      description: '精选优质报刊，月订/季订/年订多种选择',
      bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      key: 2,
      title: '新用户专享优惠',
      description: '首次订阅享8折优惠，更多精彩内容等你发现',
      bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      key: 3,
      title: '热门报刊推荐',
      description: '精选畅销报刊，品质内容每日更新',
      bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
  ]

  return (
    <div>
      <Carousel autoplay>
        {carouselItems.map((item) => (
          <div key={item.key}>
            <div
              style={{
                padding: '60px 20px',
                textAlign: 'center',
                color: 'white',
                background: item.bg,
                borderRadius: 8,
                marginBottom: 24,
              }}
            >
              <h1 style={{ fontSize: 36, marginBottom: 16, color: 'white' }}>{item.title}</h1>
              <p style={{ fontSize: 18, opacity: 0.9 }}>{item.description}</p>
              <Input.Search
                placeholder="搜索您感兴趣的报刊..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onSearch={handleSearch}
                size="large"
                style={{ maxWidth: 500, margin: '24px auto 0' }}
                enterButton={<Button type="primary" icon={<SearchOutlined />}>搜索</Button>}
              />
            </div>
          </div>
        ))}
      </Carousel>

      <div className="section-container">
        <div className="section-title">报刊分类</div>
        <div className="category-nav">
          <div
            className={`category-item ${!selectedCategory ? 'active' : ''}`}
            onClick={() => handleCategoryClick(null)}
          >
            全部
          </div>
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`category-item ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat.id)}
            >
              {cat.name}
            </div>
          ))}
        </div>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={18}>
          <div className="section-container">
            <div className="section-title">热门报刊</div>
            <Row gutter={[16, 16]}>
              {newspapers.map((item) => (
                <Col xs={12} sm={8} md={6} key={item.id}>
                  <Card
                    hoverable
                    className="newspaper-card"
                    cover={
                      <Link to={`/newspapers/${item.id}`}>
                        <img
                          alt={item.title}
                          src={item.image || 'https://picsum.photos/300/200?random=' + item.id}
                          className="newspaper-image"
                        />
                      </Link>
                    }
                    actions={[
                      <Link to={`/newspapers/${item.id}`}>查看详情</Link>,
                    ]}
                  >
                    <Meta
                      title={
                        <Link to={`/newspapers/${item.id}`} style={{ color: '#333' }}>
                          {item.title}
                        </Link>
                      }
                      description={
                        <div>
                          <div className="price-tag">¥{formatMoney(item.price)}</div>
                          <div style={{ marginTop: 8 }}>
                            <Tag color="blue">月订 ¥{formatMoney(item.month_price)}</Tag>
                            <Tag color="green">季订 ¥{formatMoney(item.quarter_price)}</Tag>
                            <Tag color="orange">年订 ¥{formatMoney(item.year_price)}</Tag>
                          </div>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
            {newspapers.length > 0 && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Button onClick={() => navigate('/newspapers')}>查看更多</Button>
              </div>
            )}
          </div>
        </Col>

        <Col xs={24} lg={6}>
          <div className="section-container">
            <div className="section-title">
              <FireOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
              销量排行
            </div>
            <div>
              {salesRanking.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: index < salesRanking.length - 1 ? '1px solid #f0f0f0' : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: index < 3 ? '#ff4d4f' : '#999',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                      fontSize: 12,
                      fontWeight: 'bold',
                    }}
                  >
                    {index + 1}
                  </div>
                  <Link
                    to={`/newspapers/${item.id}`}
                    style={{ flex: 1, color: '#333' }}
                  >
                    {item.title}
                  </Link>
                  <div className="price-tag" style={{ fontSize: 14 }}>
                    ¥{formatMoney(item.price)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default Home

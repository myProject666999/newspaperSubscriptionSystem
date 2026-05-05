import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Input, Select, Pagination, Tag, Empty, message } from 'antd'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { newspaperApi, categoryApi } from '../utils/api'
import { formatMoney } from '../utils/utils'

const { Search } = Input
const { Option } = Select
const { Meta } = Card

const NewspaperList = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [newspapers, setNewspapers] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '')
  const [categoryId, setCategoryId] = useState(searchParams.get('category_id') || undefined)
  const [sortBy, setSortBy] = useState('id')

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadNewspapers()
  }, [page, keyword, categoryId, sortBy])

  const loadCategories = async () => {
    try {
      const res = await categoryApi.getList({ status: 1 })
      setCategories(res.data || [])
    } catch (error) {
      console.error('加载分类失败:', error)
    }
  }

  const loadNewspapers = async () => {
    setLoading(true)
    try {
      const params = {
        page,
        page_size: pageSize,
      }
      if (keyword) params.keyword = keyword
      if (categoryId) params.category_id = categoryId
      if (sortBy) params.sort_by = sortBy

      const res = await newspaperApi.getList(params)
      setNewspapers(res.data?.list || [])
      setTotal(res.data?.total || 0)
    } catch (error) {
      message.error('加载报刊列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value) => {
    setKeyword(value)
    setPage(1)
    updateSearchParams(value, categoryId)
  }

  const handleCategoryChange = (value) => {
    setCategoryId(value || undefined)
    setPage(1)
    updateSearchParams(keyword, value)
  }

  const handleSortChange = (value) => {
    setSortBy(value)
  }

  const updateSearchParams = (kw, catId) => {
    const params = {}
    if (kw) params.keyword = kw
    if (catId) params.category_id = catId
    setSearchParams(params)
  }

  return (
    <div>
      <div className="section-container">
        <Row gutter={[16, 16]} align="middle">
          <Col span={8}>
            <Search
              placeholder="搜索报刊名称..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onSearch={handleSearch}
              allowClear
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="选择分类"
              value={categoryId || undefined}
              onChange={handleCategoryChange}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="">全部分类</Option>
              {categories.map((cat) => (
                <Option key={cat.id} value={cat.id}>
                  {cat.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Select
              value={sortBy}
              onChange={handleSortChange}
              style={{ width: '100%' }}
            >
              <Option value="id">默认排序</Option>
              <Option value="sales">销量优先</Option>
              <Option value="price">价格升序</Option>
            </Select>
          </Col>
          <Col span={4} style={{ textAlign: 'right', color: '#666' }}>
            共 {total} 个报刊
          </Col>
        </Row>
      </div>

      <div className="section-container">
        {newspapers.length > 0 ? (
          <>
            <Row gutter={[16, 16]}>
              {newspapers.map((item) => (
                <Col xs={12} sm={8} md={6} lg={6} key={item.id}>
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
                          <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                            销量：{item.sales}
                          </div>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
            {total > pageSize && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Pagination
                  current={page}
                  total={total}
                  pageSize={pageSize}
                  onChange={(p) => setPage(p)}
                  showSizeChanger={false}
                />
              </div>
            )}
          </>
        ) : (
          <Empty description="暂无报刊数据" />
        )}
      </div>
    </div>
  )
}

export default NewspaperList

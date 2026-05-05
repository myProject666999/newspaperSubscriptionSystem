import React, { useState, useEffect } from 'react'
import { Row, Col, Card, DatePicker, Statistic, Table, message, Spin, Descriptions } from 'antd'
import {
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  FileTextOutlined,
  MoneyCollectOutlined,
  UserAddOutlined,
  ShoppingOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { statsApi } from '../../utils/api'
import { formatMoney } from '../../utils/utils'

const { RangePicker } = DatePicker

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16']

const Stats = () => {
  const [loading, setLoading] = useState(false)
  const [statsData, setStatsData] = useState(null)
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ])

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const params = {}
      if (dateRange && dateRange.length === 2) {
        params.start_time = dateRange[0].format('YYYY-MM-DD')
        params.end_time = dateRange[1].format('YYYY-MM-DD')
      }

      const res = await statsApi.getSalesStats(params)
      setStatsData(res.data)
    } catch (error) {
      message.error('加载统计数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (dates) => {
    if (dates && dates.length === 2) {
      setDateRange(dates)
    }
  }

  const handleSearch = () => {
    loadStats()
  }

  const dailyChartData = statsData?.daily_stats?.map((item) => ({
    name: item.date,
    订单数: item.order_count,
    销售额: Number(item.total_amount.toFixed(2)),
  })) || []

  const categoryChartData = statsData?.category_stats?.map((item, index) => ({
    name: item.category,
    value: item.sales_count,
    color: COLORS[index % COLORS.length],
  })) || []

  const topNewspapersColumns = [
    {
      title: '排名',
      key: 'rank',
      width: 80,
      render: (_, __, index) => (
        <span style={{ fontWeight: 'bold', color: index < 3 ? '#ff4d4f' : '#666' }}>
          {index + 1}
        </span>
      ),
    },
    {
      title: '报刊名称',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '销售数量',
      dataIndex: 'total_sales',
      key: 'total_sales',
    },
    {
      title: '销售金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount) => <span className="price-tag">¥{formatMoney(amount)}</span>,
    },
  ]

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span>时间范围：</span>
          <RangePicker
            value={dateRange}
            onChange={handleDateChange}
            style={{ width: 300 }}
          />
          <button
            type="primary"
            onClick={handleSearch}
            style={{
              padding: '8px 20px',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            查询
          </button>
        </div>
      </Card>

      <Spin spinning={loading}>
        {statsData && (
          <>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="订单总数"
                    value={statsData.summary?.total_orders || 0}
                    prefix={<FileTextOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="销售金额"
                    value={statsData.summary?.total_amount || 0}
                    prefix={<MoneyCollectOutlined />}
                    suffix="元"
                    valueStyle={{ color: '#52c41a' }}
                    precision={2}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="新增用户"
                    value={statsData.summary?.new_users || 0}
                    prefix={<UserAddOutlined />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="在售报刊"
                    value={statsData.summary?.total_newspapers || 0}
                    prefix={<ShoppingOutlined />}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={16}>
                <Card title="销售趋势">
                  {dailyChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dailyChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="订单数"
                          stroke="#1890ff"
                          strokeWidth={2}
                          dot={{ fill: '#1890ff' }}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="销售额"
                          stroke="#52c41a"
                          strokeWidth={2}
                          dot={{ fill: '#52c41a' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ textAlign: 'center', padding: 50, color: '#999' }}>
                      暂无数据
                    </div>
                  )}
                </Card>
              </Col>
              <Col xs={24} lg={8}>
                <Card title="分类销售统计">
                  {categoryChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ textAlign: 'center', padding: 50, color: '#999' }}>
                      暂无数据
                    </div>
                  )}
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col xs={24} lg={12}>
                <Card title="每日订单统计">
                  {dailyChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dailyChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="订单数" fill="#1890ff" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ textAlign: 'center', padding: 50, color: '#999' }}>
                      暂无数据
                    </div>
                  )}
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="销量排行 TOP 10">
                  <Table
                    rowKey="newspaper_id"
                    columns={topNewspapersColumns}
                    dataSource={statsData.top_newspapers || []}
                    pagination={false}
                    size="small"
                  />
                </Card>
              </Col>
            </Row>

            <Card title="数据汇总" style={{ marginTop: 16 }}>
              <Descriptions bordered column={4}>
                <Descriptions.Item label="查询开始时间">
                  {statsData.time_range?.start || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="查询结束时间">
                  {statsData.time_range?.end || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="统计日期数">
                  {dailyChartData.length} 天
                </Descriptions.Item>
                <Descriptions.Item label="销售报刊分类数">
                  {categoryChartData.length} 个
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </>
        )}
      </Spin>
    </div>
  )
}

export default Stats

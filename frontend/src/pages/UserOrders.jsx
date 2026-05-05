import React, { useState, useEffect } from 'react'
import { Table, Card, Input, Select, Button, Tag, Modal, message, Descriptions, Divider, Empty, Image, Space } from 'antd'
import { SearchOutlined, EyeOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { orderApi } from '../utils/api'
import { formatMoney, formatDate, getOrderStatus } from '../utils/utils'

const { Search } = Input
const { Option } = Select

const UserOrders = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [status, setStatus] = useState(undefined)
  const [searchText, setSearchText] = useState('')
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [currentOrder, setCurrentOrder] = useState(null)

  useEffect(() => {
    loadOrders()
  }, [page, status])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const params = {
        page,
        page_size: pageSize,
      }
      if (status !== undefined) {
        params.status = status
      }
      if (searchText) {
        params.order_no = searchText
      }

      const res = await orderApi.getList(params)
      setOrders(res.data?.list || [])
      setTotal(res.data?.total || 0)
    } catch (error) {
      message.error('加载订单列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadOrders()
  }

  const handleCancelOrder = async (id) => {
    Modal.confirm({
      title: '确认取消',
      content: '确定要取消该订单吗？',
      onOk: async () => {
        try {
          await orderApi.cancel(id)
          message.success('订单已取消')
          loadOrders()
        } catch (error) {
          message.error('取消失败')
        }
      },
    })
  }

  const handleCompleteOrder = async (id) => {
    Modal.confirm({
      title: '确认收货',
      content: '确认已收到商品吗？',
      onOk: async () => {
        try {
          await orderApi.complete(id)
          message.success('已确认收货')
          loadOrders()
        } catch (error) {
          message.error('操作失败')
        }
      },
    })
  }

  const showOrderDetail = async (id) => {
    try {
      const res = await orderApi.getDetail(id)
      setCurrentOrder(res.data)
      setDetailModalVisible(true)
    } catch (error) {
      message.error('加载订单详情失败')
    }
  }

  const columns = [
    {
      title: '订单编号',
      dataIndex: 'order_no',
      key: 'order_no',
      render: (text, record) => <Link to={`/orders/${record.id}`}>{text}</Link>,
    },
    {
      title: '订单金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount) => <span className="price-tag">¥{formatMoney(amount)}</span>,
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const info = getOrderStatus(status)
        return <Tag color={info.color}>{info.text}</Tag>
      },
    },
    {
      title: '收货人',
      dataIndex: 'receiver',
      key: 'receiver',
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '下单时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => formatDate(date),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => showOrderDetail(record.id)}>
            详情
          </Button>
          {record.status === 1 && (
            <Button type="link" danger onClick={() => handleCancelOrder(record.id)}>
              取消订单
            </Button>
          )}
          {record.status === 2 && (
            <Button type="link" onClick={() => handleCompleteOrder(record.id)}>
              确认收货
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card title="我的订单">
        <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
          <Select
            placeholder="订单状态"
            value={status}
            onChange={(value) => {
              setStatus(value)
              setPage(1)
            }}
            style={{ width: 150 }}
            allowClear
          >
            <Option value={0}>待付款</Option>
            <Option value={1}>已付款</Option>
            <Option value={2}>已发货</Option>
            <Option value={3}>已完成</Option>
            <Option value={4}>已取消</Option>
          </Select>

          <Search
            placeholder="订单编号"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
            style={{ width: 200 }}
            enterButton={<Button type="primary" icon={<SearchOutlined />}>搜索</Button>}
          />
        </div>

        {orders.length > 0 ? (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={orders}
            loading={loading}
            pagination={{
              current: page,
              total,
              pageSize,
              showSizeChanger: false,
              onChange: (p) => setPage(p),
            }}
          />
        ) : (
          <Empty description="暂无订单" style={{ padding: 40 }}>
            <Button type="primary" onClick={() => navigate('/newspapers')}>
              去逛逛
            </Button>
          </Empty>
        )}
      </Card>

      <Modal
        title="订单详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {currentOrder && (
          <>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="订单编号">{currentOrder.order?.order_no}</Descriptions.Item>
              <Descriptions.Item label="订单状态">
                <Tag color={getOrderStatus(currentOrder.order?.status).color}>
                  {getOrderStatus(currentOrder.order?.status).text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="订单金额">
                <span className="price-tag">¥{formatMoney(currentOrder.order?.total_amount)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="收货人">{currentOrder.order?.receiver}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{currentOrder.order?.phone}</Descriptions.Item>
              <Descriptions.Item label="收货地址">{currentOrder.order?.address}</Descriptions.Item>
              <Descriptions.Item label="下单时间">{formatDate(currentOrder.order?.created_at)}</Descriptions.Item>
              <Descriptions.Item label="支付时间">{formatDate(currentOrder.order?.pay_time)}</Descriptions.Item>
            </Descriptions>

            <Divider>订单商品</Divider>

            {currentOrder.items?.map((item, index) => (
              <Card key={index} size="small" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  <Image
                    width={80}
                    height={80}
                    src={item.newspaper?.image || 'https://picsum.photos/80/80?random=' + item.id}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 8 }}>{item.newspaper?.title}</div>
                    <div style={{ marginBottom: 8 }}>
                      <Tag>{item.subscribe_type === 'month' ? '月订' : item.subscribe_type === 'quarter' ? '季订' : '年订'}</Tag>
                      <span style={{ marginLeft: 16 }}>数量：{item.quantity}</span>
                    </div>
                    <div className="price-tag">¥{formatMoney(item.price * item.quantity)}</div>
                  </div>
                </div>
              </Card>
            ))}
          </>
        )}
      </Modal>
    </div>
  )
}

export default UserOrders

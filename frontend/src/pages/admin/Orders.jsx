import React, { useState, useEffect } from 'react'
import { Table, Card, Input, Select, Button, Modal, Tag, message, Space, Popconfirm, Descriptions, Image } from 'antd'
import { SearchOutlined, EyeOutlined, TruckOutlined, DeleteOutlined } from '@ant-design/icons'
import { orderApi } from '../../utils/api'
import { formatDate, formatMoney, getOrderStatus } from '../../utils/utils'

const { Search } = Input
const { Option } = Select

const Orders = () => {
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

      const res = await orderApi.getAdminList(params)
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

  const handleShip = async (id) => {
    try {
      await orderApi.ship(id)
      message.success('发货成功')
      loadOrders()
    } catch (error) {
      message.error(error.message || '发货失败')
    }
  }

  const handleDelete = async (id) => {
    try {
      await orderApi.delete(id)
      message.success('删除成功')
      loadOrders()
    } catch (error) {
      message.error(error.message || '删除失败')
    }
  }

  const showOrderDetail = async (id) => {
    try {
      const res = await orderApi.getAdminDetail(id)
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
    },
    {
      title: '用户',
      key: 'user',
      render: (_, record) => record.user?.nickname || record.user?.username || '-',
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
            <Popconfirm
              title="确认发货吗？"
              onConfirm={() => handleShip(record.id)}
            >
              <Button type="link" icon={<TruckOutlined />}>发货</Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="确认删除该订单吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card title="订单管理">
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
            style={{ width: 250 }}
            enterButton={<Button type="primary" icon={<SearchOutlined />}>搜索</Button>}
          />
        </div>

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
              <Descriptions.Item label="用户">
                {currentOrder.order?.user?.nickname || currentOrder.order?.user?.username || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="收货人">{currentOrder.order?.receiver}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{currentOrder.order?.phone}</Descriptions.Item>
              <Descriptions.Item label="收货地址" span={2}>
                {currentOrder.order?.address}
              </Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>
                {currentOrder.order?.remark || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="下单时间">{formatDate(currentOrder.order?.created_at)}</Descriptions.Item>
              <Descriptions.Item label="支付时间">{formatDate(currentOrder.order?.pay_time)}</Descriptions.Item>
              <Descriptions.Item label="发货时间">{formatDate(currentOrder.order?.ship_time)}</Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 24 }}>
              <h4 style={{ marginBottom: 16 }}>订单商品</h4>
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
                        <Tag>
                          {item.subscribe_type === 'month' ? '月订' : 
                           item.subscribe_type === 'quarter' ? '季订' : '年订'}
                        </Tag>
                        <span style={{ marginLeft: 16 }}>数量：{item.quantity}</span>
                      </div>
                      <div className="price-tag">¥{formatMoney(item.price * item.quantity)}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}

export default Orders

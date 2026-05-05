import React, { useState, useEffect } from 'react'
import { Table, Card, Button, InputNumber, Select, Tag, Empty, message, Checkbox, Modal, Form, Input, Divider } from 'antd'
import { DeleteOutlined, ShoppingCartOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { cartApi, orderApi } from '../utils/api'
import { formatMoney, getSubscribePrice, getSubscribeTypeText } from '../utils/utils'

const { Option } = Select

const Cart = () => {
  const navigate = useNavigate()
  const [carts, setCarts] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedRows, setSelectedRows] = useState([])
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = async () => {
    setLoading(true)
    try {
      const res = await cartApi.getList()
      setCarts(res.data?.list || [])
    } catch (error) {
      message.error('加载购物车失败')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateQuantity = async (id, quantity) => {
    try {
      await cartApi.update(id, { quantity })
      await loadCart()
    } catch (error) {
      message.error('更新数量失败')
    }
  }

  const handleUpdateType = async (id, subscribeType) => {
    try {
      await cartApi.update(id, { subscribe_type: subscribeType })
      await loadCart()
    } catch (error) {
      message.error('更新订阅类型失败')
    }
  }

  const handleRemove = async (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该商品吗？',
      onOk: async () => {
        try {
          await cartApi.remove(id)
          await loadCart()
          message.success('已删除')
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  const handleCheckout = () => {
    if (selectedRows.length === 0) {
      message.warning('请选择要购买的商品')
      return
    }
    setCheckoutModalVisible(true)
  }

  const handleSubmitOrder = async (values) => {
    try {
      const res = await orderApi.create({
        cart_ids: selectedRows,
        address: values.address,
        receiver: values.receiver,
        phone: values.phone,
        remark: values.remark,
      })
      message.success('下单成功')
      setCheckoutModalVisible(false)
      navigate('/orders')
    } catch (error) {
      message.error(error.message || '下单失败')
    }
  }

  const getSelectedTotal = () => {
    let total = 0
    selectedRows.forEach((id) => {
      const item = carts.find((c) => c.id === id)
      if (item) {
        const price = getSubscribePrice(item.newspaper, item.subscribe_type)
        total += price * item.quantity
      }
    })
    return total
  }

  const rowSelection = {
    selectedRowKeys: selectedRows,
    onChange: (newSelectedRows) => {
      setSelectedRows(newSelectedRows)
    },
  }

  const columns = [
    {
      title: '报刊信息',
      key: 'newspaper',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 12 }}>
          <img
            src={record.newspaper?.image || 'https://picsum.photos/80/80?random=' + record.id}
            alt=""
            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }}
          />
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>{record.newspaper?.title}</div>
            <div style={{ marginBottom: 8 }}>
              <Tag color="blue">{getSubscribeTypeText(record.subscribe_type)}</Tag>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '订阅类型',
      key: 'subscribe_type',
      render: (_, record) => (
        <Select
          value={record.subscribe_type}
          onChange={(value) => handleUpdateType(record.id, value)}
          style={{ width: 100 }}
        >
          <Option value="month">月订</Option>
          <Option value="quarter">季订</Option>
          <Option value="year">年订</Option>
        </Select>
      ),
    },
    {
      title: '单价',
      key: 'price',
      render: (_, record) => (
        <span className="price-tag">¥{formatMoney(getSubscribePrice(record.newspaper, record.subscribe_type))}</span>
      ),
    },
    {
      title: '数量',
      key: 'quantity',
      render: (_, record) => (
        <InputNumber
          min={1}
          max={99}
          value={record.quantity}
          onChange={(value) => handleUpdateQuantity(record.id, value)}
        />
      ),
    },
    {
      title: '小计',
      key: 'subtotal',
      render: (_, record) => (
        <span className="price-tag">
          ¥{formatMoney(getSubscribePrice(record.newspaper, record.subscribe_type) * record.quantity)}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemove(record.id)}>
          删除
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Card title={<span><ShoppingCartOutlined style={{ marginRight: 8 }} />购物车</span>}>
        {carts.length > 0 ? (
          <>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={carts}
              pagination={false}
              loading={loading}
              rowSelection={rowSelection}
            />

            <Divider />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Checkbox
                  checked={selectedRows.length === carts.length && carts.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRows(carts.map((c) => c.id))
                    } else {
                      setSelectedRows([])
                    }
                  }}
                >
                  全选
                </Checkbox>
                <span style={{ marginLeft: 24 }}>已选 {selectedRows.length} 件</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div>
                  <span>合计：</span>
                  <span className="price-tag" style={{ fontSize: 20 }}>
                    ¥{formatMoney(getSelectedTotal())}
                  </span>
                </div>
                <Button
                  type="primary"
                  size="large"
                  onClick={handleCheckout}
                  disabled={selectedRows.length === 0}
                >
                  结算
                </Button>
              </div>
            </div>
          </>
        ) : (
          <Empty
            description="购物车是空的"
            style={{ padding: 40 }}
          >
            <Button type="primary" onClick={() => navigate('/newspapers')}>
              去逛逛
            </Button>
          </Empty>
        )}
      </Card>

      <Modal
        title="确认订单"
        open={checkoutModalVisible}
        onCancel={() => setCheckoutModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitOrder}>
          <Form.Item
            name="receiver"
            label="收货人"
            rules={[{ required: true, message: '请输入收货人' }]}
          >
            <Input placeholder="请输入收货人姓名" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="联系电话"
            rules={[{ required: true, message: '请输入联系电话' }]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>

          <Form.Item
            name="address"
            label="收货地址"
            rules={[{ required: true, message: '请输入收货地址' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入详细收货地址" />
          </Form.Item>

          <Form.Item
            name="remark"
            label="备注"
          >
            <Input.TextArea rows={2} placeholder="选填" />
          </Form.Item>

          <Divider />

          <div style={{ textAlign: 'right', marginBottom: 16 }}>
            <span>共 {selectedRows.length} 件商品</span>
            <span style={{ marginLeft: 24 }}>
              合计：<span className="price-tag" style={{ fontSize: 20 }}>¥{formatMoney(getSelectedTotal())}</span>
            </span>
          </div>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={() => setCheckoutModalVisible(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              确认下单
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Cart

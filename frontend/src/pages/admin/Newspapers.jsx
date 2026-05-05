import React, { useState, useEffect } from 'react'
import { Table, Card, Input, Select, Button, Modal, Form, message, Space, Popconfirm, Image, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { newspaperApi, categoryApi } from '../../utils/api'
import { formatDate, formatMoney } from '../../utils/utils'

const { Option } = Select
const { TextArea } = Input

const Newspapers = () => {
  const [newspapers, setNewspapers] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [categoryId, setCategoryId] = useState(undefined)
  const [modalVisible, setModalVisible] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [editingNewspaper, setEditingNewspaper] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadNewspapers()
  }, [page, categoryId])

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
      if (keyword) {
        params.keyword = keyword
      }
      if (categoryId) {
        params.category_id = categoryId
      }

      const res = await newspaperApi.getAdminList(params)
      setNewspapers(res.data?.list || [])
      setTotal(res.data?.total || 0)
    } catch (error) {
      message.error('加载报刊列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadNewspapers()
  }

  const handleAdd = () => {
    setModalTitle('添加报刊')
    setEditingNewspaper(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setModalTitle('编辑报刊')
    setEditingNewspaper(record)
    form.setFieldsValue({
      title: record.title,
      category_id: record.category_id,
      description: record.description,
      image: record.image,
      price: record.price,
      month_price: record.month_price,
      quarter_price: record.quarter_price,
      year_price: record.year_price,
      sales: record.sales,
      status: record.status,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await newspaperApi.delete(id)
      message.success('删除成功')
      loadNewspapers()
    } catch (error) {
      message.error(error.message || '删除失败')
    }
  }

  const handleSubmit = async (values) => {
    try {
      if (editingNewspaper) {
        await newspaperApi.update(editingNewspaper.id, values)
        message.success('更新成功')
      } else {
        await newspaperApi.create(values)
        message.success('添加成功')
      }
      setModalVisible(false)
      loadNewspapers()
    } catch (error) {
      message.error(error.message || '操作失败')
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '封面',
      dataIndex: 'image',
      key: 'image',
      width: 100,
      render: (image) => (
        image ? (
          <Image width={60} height={60} src={image} />
        ) : (
          <div style={{ width: 60, height: 60, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            无图
          </div>
        )
      ),
    },
    {
      title: '报刊名称',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category) => category?.name || '-',
    },
    {
      title: '价格',
      key: 'price',
      render: (_, record) => (
        <div>
          <div>单期: ¥{formatMoney(record.price)}</div>
          <div>月订: ¥{formatMoney(record.month_price)}</div>
        </div>
      ),
    },
    {
      title: '销量',
      dataIndex: 'sales',
      key: 'sales',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? '上架' : '下架'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => formatDate(date),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除该报刊吗？"
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
      <Card
        title="报刊管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加报刊
          </Button>
        }
      >
        <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
          <Select
            placeholder="选择分类"
            value={categoryId}
            onChange={(value) => {
              setCategoryId(value)
              setPage(1)
            }}
            style={{ width: 150 }}
            allowClear
          >
            {categories.map((cat) => (
              <Option key={cat.id} value={cat.id}>
                {cat.name}
              </Option>
            ))}
          </Select>

          <Input.Search
            placeholder="搜索报刊名称"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={handleSearch}
            style={{ width: 250 }}
            enterButton={<Button type="primary" icon={<SearchOutlined />}>搜索</Button>}
          />
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={newspapers}
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
        title={modalTitle}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="title"
            label="报刊名称"
            rules={[{ required: true, message: '请输入报刊名称' }]}
          >
            <Input placeholder="请输入报刊名称" />
          </Form.Item>

          <Form.Item
            name="category_id"
            label="分类"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="请选择分类">
              {categories.map((cat) => (
                <Option key={cat.id} value={cat.id}>
                  {cat.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="image"
            label="封面图片URL"
          >
            <Input placeholder="请输入图片URL" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
            <Form.Item
              name="price"
              label="单期价格"
              rules={[{ required: true, message: '请输入价格' }]}
            >
              <Input.Number min={0} step={0.01} style={{ width: '100%' }} placeholder="单期价格" />
            </Form.Item>

            <Form.Item
              name="month_price"
              label="月订价格"
              rules={[{ required: true, message: '请输入价格' }]}
            >
              <Input.Number min={0} step={0.01} style={{ width: '100%' }} placeholder="月订价格" />
            </Form.Item>

            <Form.Item
              name="quarter_price"
              label="季订价格"
              rules={[{ required: true, message: '请输入价格' }]}
            >
              <Input.Number min={0} step={0.01} style={{ width: '100%' }} placeholder="季订价格" />
            </Form.Item>

            <Form.Item
              name="year_price"
              label="年订价格"
              rules={[{ required: true, message: '请输入价格' }]}
            >
              <Input.Number min={0} step={0.01} style={{ width: '100%' }} placeholder="年订价格" />
            </Form.Item>
          </div>

          <Form.Item
            name="status"
            label="状态"
          >
            <Select placeholder="请选择状态">
              <Select.Option value={1}>上架</Select.Option>
              <Select.Option value={0}>下架</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={() => setModalVisible(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              确定
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Newspapers

import React, { useState, useEffect } from 'react'
import { Table, Card, Input, Select, Button, Modal, Tag, message, Space, Descriptions, Popconfirm } from 'antd'
import { SearchOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons'
import { userAdminApi } from '../../utils/api'
import { formatDate } from '../../utils/utils'

const { Search } = Input
const { Option } = Select

const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState(undefined)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    loadUsers()
  }, [page, status])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const params = {
        page,
        page_size: pageSize,
      }
      if (keyword) {
        params.keyword = keyword
      }
      if (status !== undefined) {
        params.status = status
      }

      const res = await userAdminApi.getList(params)
      setUsers(res.data?.list || [])
      setTotal(res.data?.total || 0)
    } catch (error) {
      message.error('加载用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadUsers()
  }

  const handleUpdateStatus = async (id, action) => {
    try {
      if (action === 'enable') {
        await userAdminApi.enable(id)
      } else {
        await userAdminApi.disable(id)
      }
      message.success(action === 'enable' ? '启用成功' : '停用成功')
      loadUsers()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleDelete = async (id) => {
    try {
      await userAdminApi.delete(id)
      message.success('删除成功')
      loadUsers()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const showUserDetail = async (id) => {
    try {
      const res = await userAdminApi.getDetail(id)
      setCurrentUser(res.data)
      setDetailModalVisible(true)
    } catch (error) {
      message.error('加载用户详情失败')
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
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? '正常' : '停用'}
        </Tag>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => formatDate(date),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => showUserDetail(record.id)}>
            详情
          </Button>
          {record.status === 1 ? (
            <Popconfirm
              title="确认停用该用户吗？"
              onConfirm={() => handleUpdateStatus(record.id, 'disable')}
            >
              <Button type="link" danger>停用</Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="确认启用该用户吗？"
              onConfirm={() => handleUpdateStatus(record.id, 'enable')}
            >
              <Button type="link">启用</Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="确认删除该用户吗？"
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
      <Card title="用户管理">
        <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
          <Select
            placeholder="用户状态"
            value={status}
            onChange={(value) => {
              setStatus(value)
              setPage(1)
            }}
            style={{ width: 150 }}
            allowClear
          >
            <Option value={1}>正常</Option>
            <Option value={0}>停用</Option>
          </Select>

          <Search
            placeholder="搜索用户名/昵称/邮箱"
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
          dataSource={users}
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
        title="用户详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {currentUser && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="ID">{currentUser.id}</Descriptions.Item>
            <Descriptions.Item label="用户名">{currentUser.username}</Descriptions.Item>
            <Descriptions.Item label="昵称">{currentUser.nickname || '-'}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{currentUser.email || '-'}</Descriptions.Item>
            <Descriptions.Item label="手机号">{currentUser.phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={currentUser.status === 1 ? 'green' : 'red'}>
                {currentUser.status === 1 ? '正常' : '停用'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="注册时间">{formatDate(currentUser.created_at)}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{formatDate(currentUser.updated_at)}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default Users

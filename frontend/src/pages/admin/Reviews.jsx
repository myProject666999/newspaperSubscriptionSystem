import React, { useState, useEffect } from 'react'
import { Table, Card, Button, Tag, Modal, message, Space, Popconfirm, Image, Rate, Descriptions } from 'antd'
import { DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { reviewApi } from '../../utils/api'
import { formatDate } from '../../utils/utils'

const Reviews = () => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [currentReview, setCurrentReview] = useState(null)

  useEffect(() => {
    loadReviews()
  }, [page])

  const loadReviews = async () => {
    setLoading(true)
    try {
      const params = {
        page,
        page_size: pageSize,
      }

      const res = await reviewApi.getAdminList(params)
      setReviews(res.data?.list || [])
      setTotal(res.data?.total || 0)
    } catch (error) {
      message.error('加载评价列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await reviewApi.delete(id)
      message.success('删除成功')
      loadReviews()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const showReviewDetail = (review) => {
    setCurrentReview(review)
    setDetailModalVisible(true)
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '评价用户',
      dataIndex: 'user',
      key: 'user',
      render: (user) => user?.nickname || user?.username || '未知',
    },
    {
      title: '报刊',
      dataIndex: 'newspaper',
      key: 'newspaper',
      render: (newspaper) => newspaper?.title || '未知',
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating) => (
        <Rate disabled defaultValue={rating} style={{ fontSize: 14 }} />
      ),
    },
    {
      title: '评价内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      width: 200,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? '正常' : '已删除'}
        </Tag>
      ),
    },
    {
      title: '评价时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => formatDate(date),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => showReviewDetail(record)}
          >
            详情
          </Button>
          <Popconfirm
            title="确认删除该评价吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card title="评价管理">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={reviews}
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
        title="评价详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={700}
      >
        {currentReview && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="评价ID">{currentReview.id}</Descriptions.Item>
              <Descriptions.Item label="评价用户">
                {currentReview.user?.nickname || currentReview.user?.username}
              </Descriptions.Item>
              <Descriptions.Item label="报刊">
                {currentReview.newspaper?.title}
              </Descriptions.Item>
              <Descriptions.Item label="评分">
                <Rate disabled defaultValue={currentReview.rating} />
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={currentReview.status === 1 ? 'green' : 'red'}>
                  {currentReview.status === 1 ? '正常' : '已删除'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="评价时间">
                {formatDate(currentReview.created_at)}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <h4>评价内容：</h4>
              <div style={{ padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                {currentReview.content || '（无文字评价）'}
              </div>
            </div>

            {currentReview.images && (
              <div style={{ marginTop: 16 }}>
                <h4>评价图片：</h4>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {currentReview.images.split(',').map((img, index) => (
                    <Image
                      key={index}
                      width={100}
                      height={100}
                      src={img}
                      style={{ objectFit: 'cover' }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Reviews

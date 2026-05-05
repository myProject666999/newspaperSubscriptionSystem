import React, { useState, useEffect } from 'react'
import { Card, Form, Input, Button, message, Tabs, Divider } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'
import { authApi } from '../utils/api'

const { TabPane } = Tabs
const { TextArea } = Input

const Profile = () => {
  const { user, updateUser } = useAuth()
  const [infoForm] = Form.useForm()
  const [passwordForm] = Form.useForm()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      infoForm.setFieldsValue({
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        phone: user.phone,
      })
    }
  }, [user])

  const handleUpdateInfo = async (values) => {
    setLoading(true)
    try {
      await authApi.updateUserInfo({
        nickname: values.nickname,
        email: values.email,
        phone: values.phone,
      })
      const updatedUser = { ...user, ...values }
      updateUser(updatedUser)
      message.success('个人信息更新成功')
    } catch (error) {
      message.error(error.message || '更新失败')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (values) => {
    if (values.new_password !== values.confirm_password) {
      message.error('两次输入的新密码不一致')
      return
    }

    setLoading(true)
    try {
      await authApi.changePassword({
        old_password: values.old_password,
        new_password: values.new_password,
      })
      message.success('密码修改成功')
      passwordForm.resetFields()
    } catch (error) {
      message.error(error.message || '密码修改失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Card title={<span><UserOutlined style={{ marginRight: 8 }} />个人中心</span>}>
        <Tabs defaultActiveKey="info">
          <TabPane tab="个人信息" key="info">
            <Form
              form={infoForm}
              layout="vertical"
              onFinish={handleUpdateInfo}
              style={{ maxWidth: 500 }}
            >
              <Form.Item label="用户名" name="username">
                <Input disabled />
              </Form.Item>

              <Form.Item label="昵称" name="nickname">
                <Input placeholder="请输入昵称" />
              </Form.Item>

              <Form.Item label="邮箱" name="email">
                <Input placeholder="请输入邮箱" />
              </Form.Item>

              <Form.Item label="手机号" name="phone">
                <Input placeholder="请输入手机号" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  保存修改
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab="修改密码" key="password">
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handleChangePassword}
              style={{ maxWidth: 500 }}
            >
              <Form.Item
                label="原密码"
                name="old_password"
                rules={[{ required: true, message: '请输入原密码' }]}
              >
                <Input.Password placeholder="请输入原密码" />
              </Form.Item>

              <Form.Item
                label="新密码"
                name="new_password"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 6, message: '密码至少6个字符' },
                ]}
              >
                <Input.Password placeholder="请输入新密码" />
              </Form.Item>

              <Form.Item
                label="确认新密码"
                name="confirm_password"
                rules={[{ required: true, message: '请确认新密码' }]}
              >
                <Input.Password placeholder="请再次输入新密码" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  修改密码
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export default Profile

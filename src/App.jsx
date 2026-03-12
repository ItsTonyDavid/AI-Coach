import { useState, useEffect } from 'react'
import { Layout, Card, Button, Modal, Form, Input, DatePicker, List, Tag, Progress, message, Timeline } from 'antd'
import { PlusOutlined, TrophyOutlined, CalendarOutlined, FireOutlined } from '@ant-design/icons'
import { db } from './firebase/config'
import { collection, addDoc, onSnapshot, updateDoc, doc, deleteDoc, query, orderBy } from 'firebase/firestore'
import dayjs from 'dayjs'

const { Header, Content } = Layout
const { RangePicker } = DatePicker

function App() {
  const [goals, setGoals] = useState([])
  const [monthlyPlans, setMonthlyPlans] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  // Fetch goals
  useEffect(() => {
    const q = query(collection(db, 'goals'), orderBy('targetDate', 'asc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const goalList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        targetDate: doc.data().targetDate?.toDate?.() || new Date()
      }))
      setGoals(goalList)
    })
    return () => unsubscribe()
  }, [])

  // Fetch monthly plans
  useEffect(() => {
    const q = query(collection(db, 'monthlyPlans'), orderBy('month', 'asc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const planList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setMonthlyPlans(planList)
    })
    return () => unsubscribe()
  }, [])

  const handleAddGoal = async (values) => {
    try {
      await addDoc(collection(db, 'goals'), {
        title: values.title,
        description: values.description,
        targetDate: values.targetDate.toISOString(),
        createdAt: new Date().toISOString(),
      })
      message.success('Goal added!')
      setModalOpen(false)
      form.resetFields()
    } catch (error) {
      message.error('Failed to add goal')
    }
  }

  const getDaysUntil = (targetDate) => {
    const today = dayjs()
    const target = dayjs(targetDate)
    return target.diff(today, 'day')
  }

  const getProgress = (goal) => {
    const total = dayjs(goal.targetDate).diff(dayjs(goal.createdAt), 'day')
    const remaining = getDaysUntil(goal.targetDate)
    if (total <= 0) return 100
    return Math.round(((total - remaining) / total) * 100)
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrophyOutlined style={{ fontSize: 24, color: '#faad14' }} />
          <span style={{ fontSize: 20, fontWeight: 'bold' }}>AI Coach</span>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          New Goal
        </Button>
      </Header>
      
      <Content style={{ padding: 24 }}>
        <Card title={<><FireOutlined style={{ color: '#fa541c' }} /> Current Goals</>}>
          {goals.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center' }}>No goals yet. Create one to get started!</p>
          ) : (
            <List
              dataSource={goals}
              renderItem={goal => (
                <Card type="inner" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3>{goal.title}</h3>
                      <p>{goal.description}</p>
                      <Tag icon={<CalendarOutlined />} color="blue">
                        Target: {dayjs(goal.targetDate).format('MMM D, YYYY')}
                      </Tag>
                      <Tag color="orange">
                        {getDaysUntil(goal.targetDate)} days remaining
                      </Tag>
                    </div>
                    <Progress type="circle" percent={getProgress(goal)} />
                  </div>
                </Card>
              )}
            />
          )}
        </Card>

        <Card title="Monthly Plans" style={{ marginTop: 24 }}>
          <Timeline
            items={monthlyPlans.map(plan => ({
              label: plan.month,
              children: (
                <Card type="inner" size="small">
                  <h4>{plan.title}</h4>
                  <p>{plan.description}</p>
                  {plan.workouts && (
                    <List
                      size="small"
                      dataSource={plan.workouts}
                      renderItem={w => <List.Item>{w}</List.Item>}
                    />
                  )}
                </Card>
              ),
            }))}
          />
        </Card>
      </Content>

      <Modal
        title="Add New Goal"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAddGoal}>
          <Form.Item name="title" label="Goal Title" rules={[{ required: true }]}>
            <Input placeholder="e.g., Complete Ironman 70.3" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea placeholder="Describe your goal" rows={3} />
          </Form.Item>
          <Form.Item name="targetDate" label="Target Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Add Goal
          </Button>
        </Form>
      </Modal>
    </Layout>
  )
}

export default App

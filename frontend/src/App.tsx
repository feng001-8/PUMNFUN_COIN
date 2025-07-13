import { Layout, Typography, Card } from 'antd'
import './App.css'

const { Header, Content } = Layout
const { Title, Text } = Typography

function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: '#1890ff',
        display: 'flex',
        alignItems: 'center'
      }}>
        <Title level={3} style={{ color: 'white', margin: 0 }}>
          🔥 PumpFun Golden Dog Alert System
        </Title>
      </Header>
      <Content style={{ padding: '24px' }}>
        <Card>
          <Title level={2}>🚀 System Ready!</Title>
          <Text>PumpFun Golden Dog Alert System is ready to monitor...</Text>
        </Card>
      </Content>
    </Layout>
  )
}

export default App

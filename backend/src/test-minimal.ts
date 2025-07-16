import Fastify from 'fastify'

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty'
    }
  }
})

fastify.get('/', async (request, reply) => {
  return { hello: 'world' }
})

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' })
    console.log('🚀 Minimal server started on http://localhost:3000')
  } catch (err) {
    console.error('❌ Server failed to start:', err)
    process.exit(1)
  }
}

start()
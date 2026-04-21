import Fastify from 'fastify'
import fastifyWebSocket from '@fastify/websocket'
import fastifyCors from '@fastify/cors'
import { SSHClient } from './ssh/Client.js'
import { SFTPManager } from './ssh/SFTP.js'
import { WebSocketHandler } from './websocket/Handler.js'

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
})

// Register plugins
await server.register(fastifyCors, {
  origin: true,
  credentials: true,
})

await server.register(fastifyWebSocket)

// Session store (in-memory for now, use Redis in production)
const sessions = new Map<string, { ssh: SSHClient; sftp: SFTPManager }>()

// WebSocket route
server.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, (connection, req) => {
    const wsHandler = new WebSocketHandler(connection.socket, sessions)
    wsHandler.handleConnection()
  })
})

// Health check
server.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// Start server
const start = async () => {
  try {
    await server.listen({ port: parseInt(process.env.PORT || '4000'), host: '0.0.0.0' })
    console.log(`🚀 Gateway server running on http://localhost:${process.env.PORT || '4000'}`)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()

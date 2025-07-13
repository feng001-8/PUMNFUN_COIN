// 临时的数据库模拟类，用于替代 better-sqlite3
export class MockDatabase {
  private data: Map<string, any[]> = new Map()
  
  constructor() {
    // 初始化空的数据存储
    this.data.set('tokens', [])
    this.data.set('price_data', [])
    this.data.set('trading_data', [])
    this.data.set('alerts', [])
  }

  exec(sql: string) {
    console.log('Mock DB exec:', sql)
    return this
  }

  prepare(sql: string) {
    return {
      run: (...args: any[]) => {
        console.log('Mock DB run:', sql, args)
        return { changes: 1, lastInsertRowid: Date.now() }
      },
      all: (...args: any[]) => {
        console.log('Mock DB all:', sql, args)
        return []
      },
      get: (...args: any[]) => {
        console.log('Mock DB get:', sql, args)
        return null
      }
    }
  }

  close() {
    console.log('Mock DB closed')
  }
}

export class DatabaseManager {
  private db: MockDatabase
  
  constructor(dbPath: string = './data/pumpfun.db') {
    this.db = new MockDatabase()
    this.init()
  }

  private init() {
    console.log('✅ Mock Database initialized successfully')
  }

  close() {
    this.db.close()
  }

  getDb(): MockDatabase {
    return this.db
  }
}

// 为了向后兼容，导出一个别名
export { DatabaseManager as Database }
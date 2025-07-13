import Database, { type Database as BetterSqlite3Database } from 'better-sqlite3'
// 移除 promisify 导入，因为 better-sqlite3 是同步的

export class DatabaseManager {
  private db: BetterSqlite3Database
  
  constructor(dbPath: string = './data/pumpfun.db') {
    this.db = new Database(dbPath)
    this.init()
  }

  private init() {
    // better-sqlite3 是同步的，不需要 async/await
    
    // 代币信息表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tokens (
        address TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        symbol TEXT NOT NULL,
        decimals INTEGER NOT NULL,
        total_supply TEXT NOT NULL,
        created_at DATETIME NOT NULL,
        creator_address TEXT NOT NULL,
        initial_liquidity REAL NOT NULL,
        social_links TEXT,
        is_active BOOLEAN DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 价格数据表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS price_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token_address TEXT NOT NULL,
        price REAL NOT NULL,
        price_change_1m REAL,
        price_change_5m REAL,
        price_change_15m REAL,
        price_change_1h REAL,
        price_change_24h REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (token_address) REFERENCES tokens (address)
      )
    `)

    // 交易数据表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS trading_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token_address TEXT NOT NULL,
        volume_24h REAL NOT NULL,
        volume_change REAL,
        tx_count_24h INTEGER,
        active_traders INTEGER,
        liquidity REAL,
        liquidity_change REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (token_address) REFERENCES tokens (address)
      )
    `)

    // 预警表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        token_address TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        score INTEGER NOT NULL,
        conditions TEXT NOT NULL,
        timestamp DATETIME NOT NULL,
        is_read BOOLEAN DEFAULT 0,
        FOREIGN KEY (token_address) REFERENCES tokens (address)
      )
    `)
    
    // 创建索引
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_price_data_token_time ON price_data (token_address, timestamp)')
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_trading_data_token_time ON trading_data (token_address, timestamp)')
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_alerts_token_time ON alerts (token_address, timestamp)')
    
    console.log('✅ Database initialized successfully')
  }

  close() {
    this.db.close()
  }

  getDb(): BetterSqlite3Database {
    return this.db
  }
}

// 为了向后兼容，导出一个别名
export { DatabaseManager as Database }
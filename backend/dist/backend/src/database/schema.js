import Database from 'better-sqlite3';
// 移除 promisify 导入，因为 better-sqlite3 是同步的
export class DatabaseManager {
    db;
    constructor(dbPath = './data/pumpfun.db') {
        this.db = new Database(dbPath);
        this.init();
    }
    init() {
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
    `);
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
    `);
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
    `);
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
    `);
        // KOL信息表
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS kol_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT, -- Twitter用户ID或钱包地址
        wallet_address TEXT, -- 钱包地址（可为空）
        name TEXT,
        category TEXT NOT NULL, -- 'crypto_trader', 'analyst', 'influencer', 'whale', 'developer'
        platform TEXT DEFAULT 'solana', -- 'solana', 'twitter', 'telegram'
        influence_score INTEGER DEFAULT 0, -- 0-100
        credibility_score INTEGER DEFAULT 0, -- 0-100
        success_rate REAL DEFAULT 0, -- 0-100
        total_trades INTEGER DEFAULT 0,
        profitable_trades INTEGER DEFAULT 0,
        avg_profit_rate REAL DEFAULT 0,
        followers_count INTEGER DEFAULT 0,
        verified BOOLEAN DEFAULT 0,
        tags TEXT, -- JSON array of tags
        social_links TEXT, -- JSON object with social media links
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1,
        UNIQUE(user_id, platform)
      )
    `);
        // KOL交易记录表
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS kol_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kol_wallet_address TEXT NOT NULL,
        token_address TEXT NOT NULL,
        transaction_hash TEXT NOT NULL,
        action TEXT NOT NULL, -- 'buy', 'sell'
        amount REAL NOT NULL,
        price REAL NOT NULL,
        value_sol REAL NOT NULL,
        timestamp DATETIME NOT NULL,
        profit_loss REAL, -- calculated profit/loss for sells
        holding_period INTEGER, -- holding time in seconds for sells
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (kol_wallet_address) REFERENCES kol_info (wallet_address),
        FOREIGN KEY (token_address) REFERENCES tokens (address)
      )
    `);
        // 社群情绪数据表
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS sentiment_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token_address TEXT NOT NULL,
        platform TEXT NOT NULL, -- 'twitter', 'telegram', 'discord'
        mention_count INTEGER DEFAULT 0,
        positive_mentions INTEGER DEFAULT 0,
        negative_mentions INTEGER DEFAULT 0,
        neutral_mentions INTEGER DEFAULT 0,
        sentiment_score REAL DEFAULT 0, -- -1 to 1
        engagement_score REAL DEFAULT 0, -- 0-100
        trending_score REAL DEFAULT 0, -- 0-100
        keywords TEXT, -- JSON array of trending keywords
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (token_address) REFERENCES tokens (address)
      )
    `);
        // 用户预警配置表
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_alert_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL, -- 用户标识
        config_name TEXT NOT NULL,
        alert_type TEXT NOT NULL, -- 'golden_dog', 'risk_warning', 'kol_signal', 'sentiment'
        conditions TEXT NOT NULL, -- JSON object with alert conditions
        notification_methods TEXT NOT NULL, -- JSON array: ['email', 'telegram', 'desktop']
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // 技术指标数据表
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS technical_indicators (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token_address TEXT NOT NULL,
        rsi_14 REAL,
        macd_line REAL,
        macd_signal REAL,
        macd_histogram REAL,
        bb_upper REAL,
        bb_middle REAL,
        bb_lower REAL,
        volume_sma_20 REAL,
        price_sma_20 REAL,
        price_ema_12 REAL,
        price_ema_26 REAL,
        support_level REAL,
        resistance_level REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (token_address) REFERENCES tokens (address)
      )
    `);
        // Twitter推文情绪数据表
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS twitter_sentiment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tweet_id TEXT UNIQUE NOT NULL,
        text TEXT NOT NULL,
        author_id TEXT NOT NULL,
        author_username TEXT NOT NULL,
        author_followers INTEGER DEFAULT 0,
        created_at DATETIME NOT NULL,
        retweet_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        reply_count INTEGER DEFAULT 0,
        quote_count INTEGER DEFAULT 0,
        sentiment TEXT NOT NULL, -- 'positive', 'negative', 'neutral'
        sentiment_score REAL NOT NULL, -- -100 to 100
        token_mentions TEXT, -- JSON array of mentioned tokens
        is_influencer BOOLEAN DEFAULT 0,
        processed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // 代币符号到地址映射表
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS token_symbol_mapping (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL,
        address TEXT NOT NULL,
        name TEXT,
        is_verified BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(symbol, address)
      )
    `);
        // 交易记录表
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS trades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token_address TEXT NOT NULL,
        transaction_signature TEXT UNIQUE NOT NULL,
        trader_address TEXT NOT NULL,
        is_buy BOOLEAN NOT NULL,
        sol_amount REAL NOT NULL,
        token_amount REAL NOT NULL,
        price_per_token REAL NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (token_address) REFERENCES tokens (address)
      )
    `);
        // 创建索引
        this.db.exec('CREATE INDEX IF NOT EXISTS idx_price_data_token_time ON price_data (token_address, timestamp)');
        this.db.exec('CREATE INDEX IF NOT EXISTS idx_trading_data_token_time ON trading_data (token_address, timestamp)');
        this.db.exec('CREATE INDEX IF NOT EXISTS idx_alerts_token_time ON alerts (token_address, timestamp)');
        this.db.exec('CREATE INDEX IF NOT EXISTS idx_trades_token_time ON trades (token_address, timestamp)');
        this.db.exec('CREATE INDEX IF NOT EXISTS idx_trades_signature ON trades (transaction_signature)');
        // KOL相关索引
        this.db.exec('CREATE INDEX IF NOT EXISTS idx_kol_info_wallet ON kol_info (wallet_address)');
        this.db.exec('CREATE INDEX IF NOT EXISTS idx_kol_info_category ON kol_info (category, is_active)');
        this.db.exec('CREATE INDEX IF NOT EXISTS idx_kol_transactions_wallet_time ON kol_transactions (kol_wallet_address, timestamp)');
        this.db.exec('CREATE INDEX IF NOT EXISTS idx_kol_transactions_token_time ON kol_transactions (token_address, timestamp)');
        // 情绪分析索引
        this.db.exec('CREATE INDEX IF NOT EXISTS idx_sentiment_token_platform_time ON sentiment_data (token_address, platform, timestamp)');
        // 用户配置索引
        this.db.exec('CREATE INDEX IF NOT EXISTS idx_user_alert_configs_user_active ON user_alert_configs (user_id, is_active)');
        // 技术指标索引
        this.db.exec('CREATE INDEX IF NOT EXISTS idx_technical_indicators_token_time ON technical_indicators (token_address, timestamp)');
        // Twitter相关索引
        this.db.exec('CREATE INDEX IF NOT EXISTS idx_twitter_sentiment_tweet_id ON twitter_sentiment (tweet_id)');
        this.db.exec('CREATE INDEX IF NOT EXISTS idx_twitter_sentiment_author_time ON twitter_sentiment (author_id, created_at)');
        this.db.exec('CREATE INDEX IF NOT EXISTS idx_twitter_sentiment_sentiment_time ON twitter_sentiment (sentiment, created_at)');
        this.db.exec('CREATE INDEX IF NOT EXISTS idx_twitter_sentiment_influencer ON twitter_sentiment (is_influencer, created_at)');
        // 代币映射索引
        this.db.exec('CREATE INDEX IF NOT EXISTS idx_token_symbol_mapping_symbol ON token_symbol_mapping (symbol)');
        this.db.exec('CREATE INDEX IF NOT EXISTS idx_token_symbol_mapping_address ON token_symbol_mapping (address)');
        // 更新KOL信息索引
        this.db.exec('CREATE INDEX IF NOT EXISTS idx_kol_info_user_platform ON kol_info (user_id, platform)');
        this.db.exec('CREATE INDEX IF NOT EXISTS idx_kol_info_platform_active ON kol_info (platform, is_active)');
        console.log('✅ Database initialized successfully');
    }
    close() {
        this.db.close();
    }
    getDb() {
        return this.db;
    }
}
// 为了向后兼容，导出一个别名
export { DatabaseManager as Database };
//# sourceMappingURL=schema.js.map
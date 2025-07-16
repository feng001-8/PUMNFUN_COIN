// 临时的数据库模拟类，用于替代 better-sqlite3
export class MockDatabase {
    data = new Map();
    constructor() {
        // 初始化空的数据存储
        this.data.set('tokens', []);
        this.data.set('price_data', []);
        this.data.set('trading_data', []);
        this.data.set('alerts', []);
    }
    exec(sql) {
        console.log('Mock DB exec:', sql);
        return this;
    }
    prepare(sql) {
        return {
            run: (...args) => {
                console.log('Mock DB run:', sql, args);
                return { changes: 1, lastInsertRowid: Date.now() };
            },
            all: (...args) => {
                console.log('Mock DB all:', sql, args);
                return [];
            },
            get: (...args) => {
                console.log('Mock DB get:', sql, args);
                return null;
            }
        };
    }
    close() {
        console.log('Mock DB closed');
    }
}
export class DatabaseManager {
    db;
    constructor(dbPath = './data/pumpfun.db') {
        this.db = new MockDatabase();
        this.init();
    }
    init() {
        console.log('✅ Mock Database initialized successfully');
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
//# sourceMappingURL=mock-database.js.map
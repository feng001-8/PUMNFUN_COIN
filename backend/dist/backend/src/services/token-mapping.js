import { logger } from '../utils/logger.js';
import { enhancedErrorHandler } from '../utils/enhanced-error-handler.js';
export class TokenMappingService {
    db;
    symbolToAddressCache = new Map();
    addressToSymbolCache = new Map();
    lastCacheUpdate = 0;
    CACHE_DURATION = 300000; // 5分钟缓存
    constructor(db) {
        this.db = db;
        logger.info('🗺️ 代币映射服务已初始化');
    }
    async start() {
        try {
            // 初始化映射数据
            await this.initializeMappings();
            // 定期更新映射
            setInterval(() => {
                this.updateMappings().catch(error => {
                    logger.warn('更新代币映射时出错:', error);
                });
            }, this.CACHE_DURATION);
            logger.info('🗺️ 代币映射服务启动完成');
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, 'TokenMappingService.start');
            throw error;
        }
    }
    // 初始化映射数据
    async initializeMappings() {
        try {
            // 从tokens表同步数据到映射表
            await this.syncTokensToMapping();
            // 添加一些常见代币的映射
            await this.addCommonTokenMappings();
            // 更新缓存
            await this.updateCache();
            logger.info('🗺️ 代币映射初始化完成');
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, 'initializeMappings');
        }
    }
    // 从tokens表同步数据到映射表
    async syncTokensToMapping() {
        const db = this.db.getDb();
        try {
            // 获取所有代币
            const tokensStmt = db.prepare(`
        SELECT address, symbol, name FROM tokens
        WHERE is_active = 1
      `);
            const tokens = tokensStmt.all();
            // 插入到映射表
            const insertStmt = db.prepare(`
        INSERT OR REPLACE INTO token_symbol_mapping 
        (symbol, address, name, is_verified, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `);
            for (const token of tokens) {
                insertStmt.run(token.symbol.toUpperCase(), token.address, token.name, 1 // 来自tokens表的都标记为已验证
                );
            }
            logger.debug(`🗺️ 同步了 ${tokens.length} 个代币映射`);
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, 'syncTokensToMapping');
        }
    }
    // 添加常见代币映射
    async addCommonTokenMappings() {
        const commonTokens = [
            {
                symbol: 'SOL',
                address: 'So11111111111111111111111111111111111111112',
                name: 'Solana',
                isVerified: true
            },
            {
                symbol: 'USDC',
                address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                name: 'USD Coin',
                isVerified: true
            },
            {
                symbol: 'USDT',
                address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
                name: 'Tether USD',
                isVerified: true
            },
            {
                symbol: 'RAY',
                address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
                name: 'Raydium',
                isVerified: true
            },
            {
                symbol: 'SRM',
                address: 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt',
                name: 'Serum',
                isVerified: true
            }
        ];
        const db = this.db.getDb();
        const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO token_symbol_mapping 
      (symbol, address, name, is_verified, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `);
        for (const token of commonTokens) {
            insertStmt.run(token.symbol, token.address, token.name, token.isVerified ? 1 : 0);
        }
        logger.debug(`🗺️ 添加了 ${commonTokens.length} 个常见代币映射`);
    }
    // 更新映射数据
    async updateMappings() {
        try {
            await this.syncTokensToMapping();
            await this.updateCache();
        }
        catch (error) {
            logger.warn('更新映射数据时出错:', error);
        }
    }
    // 更新缓存
    async updateCache() {
        const db = this.db.getDb();
        try {
            const stmt = db.prepare(`
        SELECT symbol, address FROM token_symbol_mapping
        WHERE is_verified = 1
      `);
            const mappings = stmt.all();
            // 清空缓存
            this.symbolToAddressCache.clear();
            this.addressToSymbolCache.clear();
            // 重新填充缓存
            for (const mapping of mappings) {
                this.symbolToAddressCache.set(mapping.symbol.toUpperCase(), mapping.address);
                this.addressToSymbolCache.set(mapping.address, mapping.symbol.toUpperCase());
            }
            this.lastCacheUpdate = Date.now();
            logger.debug(`🗺️ 缓存更新完成，共 ${mappings.length} 个映射`);
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, 'updateCache');
        }
    }
    // 根据符号获取地址
    async getAddressBySymbol(symbol) {
        try {
            // 检查缓存是否需要更新
            if (Date.now() - this.lastCacheUpdate > this.CACHE_DURATION) {
                await this.updateCache();
            }
            const upperSymbol = symbol.toUpperCase();
            const cachedAddress = this.symbolToAddressCache.get(upperSymbol);
            if (cachedAddress) {
                return cachedAddress;
            }
            // 缓存中没有，查询数据库
            const db = this.db.getDb();
            const stmt = db.prepare(`
        SELECT address FROM token_symbol_mapping
        WHERE symbol = ? AND is_verified = 1
        ORDER BY updated_at DESC
        LIMIT 1
      `);
            const result = stmt.get(upperSymbol);
            if (result) {
                // 更新缓存
                this.symbolToAddressCache.set(upperSymbol, result.address);
                return result.address;
            }
            return null;
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, 'getAddressBySymbol', { symbol });
            return null;
        }
    }
    // 根据地址获取符号
    async getSymbolByAddress(address) {
        try {
            // 检查缓存是否需要更新
            if (Date.now() - this.lastCacheUpdate > this.CACHE_DURATION) {
                await this.updateCache();
            }
            const cachedSymbol = this.addressToSymbolCache.get(address);
            if (cachedSymbol) {
                return cachedSymbol;
            }
            // 缓存中没有，查询数据库
            const db = this.db.getDb();
            const stmt = db.prepare(`
        SELECT symbol FROM token_symbol_mapping
        WHERE address = ? AND is_verified = 1
        LIMIT 1
      `);
            const result = stmt.get(address);
            if (result) {
                // 更新缓存
                this.addressToSymbolCache.set(address, result.symbol);
                return result.symbol;
            }
            return null;
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, 'getSymbolByAddress', { address });
            return null;
        }
    }
    // 批量获取地址
    async getAddressesBySymbols(symbols) {
        const result = new Map();
        for (const symbol of symbols) {
            const address = await this.getAddressBySymbol(symbol);
            if (address) {
                result.set(symbol.toUpperCase(), address);
            }
        }
        return result;
    }
    // 添加新的代币映射
    async addTokenMapping(symbol, address, name, isVerified = false) {
        const db = this.db.getDb();
        try {
            const stmt = db.prepare(`
        INSERT OR REPLACE INTO token_symbol_mapping 
        (symbol, address, name, is_verified, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `);
            stmt.run(symbol.toUpperCase(), address, name, isVerified ? 1 : 0);
            // 更新缓存
            if (isVerified) {
                this.symbolToAddressCache.set(symbol.toUpperCase(), address);
                this.addressToSymbolCache.set(address, symbol.toUpperCase());
            }
            logger.debug(`🗺️ 添加代币映射: ${symbol} -> ${address}`);
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, 'addTokenMapping', { symbol, address });
        }
    }
    // 验证代币映射
    async verifyTokenMapping(symbol, address) {
        const db = this.db.getDb();
        try {
            const stmt = db.prepare(`
        UPDATE token_symbol_mapping 
        SET is_verified = 1, updated_at = datetime('now')
        WHERE symbol = ? AND address = ?
      `);
            stmt.run(symbol.toUpperCase(), address);
            // 更新缓存
            this.symbolToAddressCache.set(symbol.toUpperCase(), address);
            this.addressToSymbolCache.set(address, symbol.toUpperCase());
            logger.debug(`🗺️ 验证代币映射: ${symbol} -> ${address}`);
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, 'verifyTokenMapping', { symbol, address });
        }
    }
    // 获取所有映射统计
    async getMappingStats() {
        const db = this.db.getDb();
        try {
            const totalStmt = db.prepare('SELECT COUNT(*) as count FROM token_symbol_mapping');
            const verifiedStmt = db.prepare('SELECT COUNT(*) as count FROM token_symbol_mapping WHERE is_verified = 1');
            const unverifiedStmt = db.prepare('SELECT COUNT(*) as count FROM token_symbol_mapping WHERE is_verified = 0');
            const recentStmt = db.prepare(`
        SELECT COUNT(*) as count FROM token_symbol_mapping 
        WHERE created_at > datetime('now', '-24 hours')
      `);
            const total = totalStmt.get().count;
            const verified = verifiedStmt.get().count;
            const unverified = unverifiedStmt.get().count;
            const recent = recentStmt.get().count;
            return {
                totalMappings: total,
                verifiedMappings: verified,
                unverifiedMappings: unverified,
                recentlyAdded: recent
            };
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, 'getMappingStats');
            return {
                totalMappings: 0,
                verifiedMappings: 0,
                unverifiedMappings: 0,
                recentlyAdded: 0
            };
        }
    }
    // 搜索代币映射
    async searchTokenMappings(query, limit = 20) {
        const db = this.db.getDb();
        try {
            const stmt = db.prepare(`
        SELECT symbol, address, name, is_verified
        FROM token_symbol_mapping
        WHERE symbol LIKE ? OR name LIKE ?
        ORDER BY is_verified DESC, symbol ASC
        LIMIT ?
      `);
            const searchQuery = `%${query.toUpperCase()}%`;
            const results = stmt.all(searchQuery, searchQuery, limit);
            return results.map(row => ({
                symbol: row.symbol,
                address: row.address,
                name: row.name,
                isVerified: row.is_verified === 1
            }));
        }
        catch (error) {
            await enhancedErrorHandler.handleError(error, 'searchTokenMappings', { query });
            return [];
        }
    }
}
//# sourceMappingURL=token-mapping.js.map
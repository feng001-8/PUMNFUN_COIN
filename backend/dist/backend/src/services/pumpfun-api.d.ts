import type { TokenInfo, TradingData } from '../../../shared/types/index.ts';
interface PumpFunTradeResponse {
    signature: string;
    mint: string;
    sol_amount: number;
    token_amount: number;
    is_buy: boolean;
    user: string;
    timestamp: number;
    tx_index: number;
    username?: string;
    profile_image?: string;
}
export declare class PumpFunAPI {
    private config;
    /**
     * 获取最新的代币列表
     */
    getNewTokens(limit?: number, offset?: number): Promise<TokenInfo[]>;
    /**
     * 获取特定代币信息
     */
    getTokenInfo(address: string): Promise<TokenInfo | null>;
    /**
     * 获取代币交易数据
     */
    getTokenTrades(address: string, limit?: number): Promise<PumpFunTradeResponse[]>;
    /**
     * 计算交易数据指标
     */
    calculateTradingData(address: string): Promise<TradingData | null>;
    /**
     * 转换PumpFun API响应为内部TokenInfo格式
     */
    private transformTokenResponse;
    /**
     * 计算流动性（基于虚拟储备）
     */
    private calculateLiquidity;
    /**
     * 检查代币是否符合金狗条件
     */
    checkGoldenDogCriteria(address: string): Promise<{
        isGoldenDog: boolean;
        score: number;
        reasons: string[];
    }>;
}
export declare const pumpFunAPI: PumpFunAPI;
export {};

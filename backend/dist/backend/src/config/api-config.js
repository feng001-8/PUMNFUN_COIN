export const defaultConfig = {
    pumpportal: {
        websocketUrl: 'wss://pumpportal.fun/api/data',
        enabled: true,
        reconnectAttempts: 5,
        reconnectDelay: 5000
    },
    jupiter: {
        baseUrl: 'https://lite-api.jup.ag/v4',
        endpoints: {
            price: '/price',
            quote: '/quote'
        }
    },
    solana: {
        rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
        commitment: 'confirmed'
    }
};
// 环境变量配置
export const getConfig = () => {
    return {
        ...defaultConfig,
        pumpportal: {
            ...defaultConfig.pumpportal,
            websocketUrl: process.env.PUMPPORTAL_WS_URL || defaultConfig.pumpportal.websocketUrl,
            enabled: process.env.PUMPPORTAL_ENABLED !== 'false'
        },
        jupiter: {
            ...defaultConfig.jupiter,
            baseUrl: process.env.JUPITER_API_URL || defaultConfig.jupiter.baseUrl
        },
        solana: {
            ...defaultConfig.solana,
            rpcUrl: process.env.SOLANA_RPC_URL || defaultConfig.solana.rpcUrl
        }
    };
};
//# sourceMappingURL=api-config.js.map
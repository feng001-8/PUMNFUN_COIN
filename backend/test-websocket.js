import { io } from 'socket.io-client';

// 连接到Socket.IO服务器
const socket = io('http://127.0.0.1:3000');

console.log('正在连接到WebSocket服务器...');

socket.on('connect', () => {
  console.log('✅ WebSocket连接成功');
  console.log('Socket ID:', socket.id);
  
  // 订阅新代币事件
  socket.on('new_token', (token) => {
    console.log('🪙 收到新代币:', {
      symbol: token.symbol,
      name: token.name,
      address: token.address
    });
  });
  
  // 订阅交易更新
  socket.on('trade_update', (trade) => {
    console.log('💰 收到交易更新:', {
      mint: trade.mint,
      solAmount: trade.solAmount,
      isBuy: trade.isBuy
    });
  });
  
  // 订阅预警
  socket.on('alert', (alert) => {
    console.log('🚨 收到预警:', alert);
  });
  
  // 订阅错误统计
  socket.on('error_stats', (stats) => {
    console.log('📊 错误统计更新:', stats);
  });
});

socket.on('disconnect', () => {
  console.log('❌ WebSocket连接断开');
});

socket.on('connect_error', (error) => {
  console.log('❌ WebSocket连接错误:', error.message);
});

// 运行30秒后退出
setTimeout(() => {
  console.log('\n测试完成，断开连接');
  socket.disconnect();
  process.exit(0);
}, 30000);

console.log('WebSocket测试运行中，将在30秒后自动退出...');
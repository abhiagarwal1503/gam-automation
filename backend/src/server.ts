import { createApp } from './app';
import { config } from './config';

const app = createApp();

const server = app.listen(config.port, '127.0.0.1', () => {
  console.log(`🚀 GAM Automation Backend running on http://127.0.0.1:${config.port}`);
  console.log(`📡 Environment: ${config.appEnv} (Node: ${config.nodeEnv})`);
  console.log(`🎯 Google Ad Manager Network: ${config.gam.networkCode} (${config.gam.apiVersion})`);
});

export default server;
import { createApp } from './app';
import { config } from './config';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`🚀 GAM Automation Backend running on http://localhost:${config.port}`);
  console.log(`📡 Environment: ${config.appEnv} (Node: ${config.nodeEnv})`);
  console.log(`🎯 Google Ad Manager Network: ${config.gam.networkCode} (${config.gam.apiVersion})`);
});

export default server;

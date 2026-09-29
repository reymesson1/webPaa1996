import { createApp } from './app';
import { config } from './config/env';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(`  🧠 DocIntel AI - Document Intelligence Backend`);
  console.log(`  🚀 Running on: http://localhost:${config.port}`);
  console.log(`  ⚙️  Environment: ${config.nodeEnv}`);
  console.log(`  🤖 Active LLM Provider: ${config.llmProvider}`);
  console.log(`  📝 Active Prompt Version: ${config.defaultPromptVersion}`);
  console.log(`  🛡️  PII Redaction: ${config.enablePiiRedaction ? 'ENABLED' : 'DISABLED'}`);
  console.log(`====================================================`);
});

export default server;

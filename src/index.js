const { TTSAPI } = require('./api/routes');
const { TTS } = require('./tts/core');

/**
 * Main application entry point
 */
class GenSparkTTS {
  constructor(options = {}) {
    this.options = {
      port: options.port || 3000,
      webuiPort: options.webuiPort || 7860,
      ...options
    };
    
    this.tts = null;
    this.api = null;
  }
  
  /**
   * Initialize the application
   */
  async init() {
    console.log('🚀 Initializing GenSpark TTS...');
    
    // Initialize TTS system
    this.tts = new TTS({
      model: 'v1',
      sampleRate: 24000,
      steps: 32,
      cfg: 2.0
    });
    
    // Wait for TTS initialization
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('TTS initialization timeout'));
      }, 10000);
      
      this.tts.on('initialized', () => {
        clearTimeout(timeout);
        resolve();
      });
      
      this.tts.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
    
    // Initialize API
    this.api = new TTSAPI({
      port: this.options.port,
      tts: this.tts
    });
    
    console.log('✅ GenSpark TTS initialized successfully');
  }
  
  /**
   * Start the application
   */
  async start() {
    try {
      await this.init();
      
      // Start API server
      await this.api.start();
      
      console.log(`🌐 API server running on port ${this.options.port}`);
      console.log(`📖 API documentation: http://localhost:${this.options.port}/api/health`);
      
      // Keep the process running
      process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down gracefully...');
        await this.stop();
        process.exit(0);
      });
      
      process.on('SIGTERM', async () => {
        console.log('\n🛑 Shutting down gracefully...');
        await this.stop();
        process.exit(0);
      });
      
    } catch (error) {
      console.error('❌ Failed to start application:', error);
      process.exit(1);
    }
  }
  
  /**
   * Stop the application
   */
  async stop() {
    if (this.api) {
      await this.api.stop();
    }
    console.log('👋 Application stopped');
  }
}

// CLI interface
if (require.main === module) {
  const app = new GenSparkTTS({
    port: process.env.PORT || 3000
  });
  
  app.start().catch((error) => {
    console.error('Failed to start:', error);
    process.exit(1);
  });
}

module.exports = { GenSparkTTS };
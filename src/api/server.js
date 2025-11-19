const { TTSAPI } = require('./src/api/routes');

// Create and start API server
const api = new TTSAPI({
  port: process.env.PORT || 3000,
  tts: {
    model: process.env.TTS_MODEL || 'v1',
    sampleRate: parseInt(process.env.TTS_SAMPLE_RATE) || 24000
  }
});

api.start().then(port => {
  console.log(`🚀 TTS API Server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
  console.log(`🎙️  Voices: http://localhost:${port}/api/tts/voices`);
}).catch(error => {
  console.error('Failed to start API server:', error);
  process.exit(1);
});
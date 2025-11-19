#!/usr/bin/env node

const { TTSWebUI } = require('./src/webui/gradio-app');

/**
 * Launch Gradio interface with trained voice model support
 */
async function main() {
  try {
    console.log('🎙️  GenSpark TTS with Trained Voice Models');
    console.log('==========================================');
    console.log('');
    console.log('Available trained voice models:');
    console.log('- thai_voice_9c7bb60b (Thai voice trained on 40 samples)');
    console.log('');
    
    const webui = new TTSWebUI({
      port: 7860,
      tts: {
        model: 'v2', // Use v2 model for better quality
        sampleRate: 24000
      }
    });
    
    await webui.launch();
    
  } catch (error) {
    console.error('Failed to launch Gradio interface:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
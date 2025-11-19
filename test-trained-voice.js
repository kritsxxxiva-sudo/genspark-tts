#!/usr/bin/env node

const TTS = require('./src/tts/core');

/**
 * Test trained voice synthesis
 */
async function testTrainedVoiceSynthesis() {
  console.log('🧪 Testing Trained Voice Synthesis');
  console.log('====================================');
  
  try {
    // Initialize TTS
    const tts = new TTS({
      model: 'v2',
      sampleRate: 24000
    });
    
    // Wait for initialization
    await new Promise((resolve) => {
      tts.on('initialized', resolve);
    });
    
    console.log('✅ TTS system initialized');
    
    // Check if trained voice exists
    const voices = tts.getVoices();
    console.log('Available voices:', voices);
    
    if (voices.trained.length === 0) {
      console.log('⚠️  No trained voices found. Make sure to train a voice first.');
      return;
    }
    
    // Test synthesis with trained voice
    const testText = 'สวัสดีครับ นี่คือการทดสอบเสียงที่ฝึกมาใหม่';
    const modelId = 'thai_voice_9c7bb60b';
    
    console.log(`🎯 Testing synthesis with trained voice: ${modelId}`);
    console.log(`📝 Text: ${testText}`);
    
    const result = await tts.synthesizeWithTrainedVoice({
      text: testText,
      modelId: modelId,
      speed: 1.0,
      steps: 32,
      cfg: 2.0
    });
    
    console.log('✅ Synthesis completed!');
    console.log(`📊 Duration: ${result.duration.toFixed(2)}s`);
    console.log(`⏱️  Processing time: ${result.processingTime}ms`);
    console.log(`🎵 Voice characteristics:`, result.voiceCharacteristics);
    
    // Test with English text
    const englishText = 'Hello, this is my trained voice speaking!';
    console.log(`\n🎯 Testing English synthesis with Thai trained voice`);
    console.log(`📝 Text: ${englishText}`);
    
    const englishResult = await tts.synthesizeWithTrainedVoice({
      text: englishText,
      modelId: modelId,
      speed: 1.0
    });
    
    console.log('✅ English synthesis completed!');
    console.log(`📊 Duration: ${englishResult.duration.toFixed(2)}s`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

if (require.main === module) {
  testTrainedVoiceSynthesis();
}

module.exports = { testTrainedVoiceSynthesis };
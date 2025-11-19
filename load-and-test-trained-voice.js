#!/usr/bin/env node

const TTS = require('./src/tts/core');
const VoiceTrainer = require('./src/tts/voice-trainer');
const fs = require('fs').promises;
const path = require('path');

/**
 * Load trained voice model into TTS system
 */
async function loadTrainedVoice() {
  console.log('🎙️ Loading Trained Voice Model');
  console.log('====================================');
  
  try {
    // Read trained model summary
    const modelSummaryPath = path.join(__dirname, 'trained_model_summary.json');
    const modelData = JSON.parse(await fs.readFile(modelSummaryPath, 'utf-8'));
    
    console.log('✅ Loaded trained model data:', modelData.id);
    
    // Initialize TTS with voice trainer
    const voiceTrainer = new VoiceTrainer({
      sampleRate: 24000,
      maxEpochs: 100
    });
    
    // Add the trained model to the voice trainer
    voiceTrainer.trainedModels.set(modelData.id, modelData);
    
    // Initialize TTS
    const tts = new TTS({
      model: 'v2',
      sampleRate: 24000
    });
    
    // Manually set the voice trainer
    tts.voiceTrainer = voiceTrainer;
    tts.initialized = true;
    
    // Manually add trained voice to TTS
    tts.trainedVoices.set(modelData.id, {
      id: modelData.id,
      name: modelData.name,
      type: 'trained',
      characteristics: modelData.voiceCharacteristics,
      metadata: modelData.metadata,
      createdAt: modelData.createdAt
    });
    
    console.log('✅ TTS system initialized with trained voice');
    
    // Test synthesis with trained voice
    const testText = 'สวัสดีครับ นี่คือการทดสอบเสียงที่ฝึกมาใหม่';
    const modelId = modelData.id;
    
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
    
    // List available voices
    const voices = tts.getVoices();
    console.log('\n📋 Available voices:');
    console.log('Default voices:', voices.default.map(v => v.id));
    console.log('Trained voices:', voices.trained.map(v => v.id));
    
    console.log('\n🎉 Trained voice synthesis test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

if (require.main === module) {
  loadTrainedVoice();
}

module.exports = { loadTrainedVoice };
#!/usr/bin/env node

const path = require('path');
const VoiceTrainer = require('./src/tts/voice-trainer.js');

/**
 * Simple voice training script for Thai dataset
 * Usage: node train-thai-voice.js
 */

async function trainThaiVoice() {
  console.log('🎯 Starting Thai Voice Training...');
  console.log('=====================================');
  
  const datasetPath = '/home/user/uploaded_files';
  const voiceName = 'thai_voice';
  const epochs = 75;
  const batchSize = 8;
  
  console.log(`Dataset: ${datasetPath}`);
  console.log(`Voice Name: ${voiceName}`);
  console.log(`Epochs: ${epochs}`);
  console.log(`Batch Size: ${batchSize}`);
  console.log('');
  
  // Create voice trainer
  const trainer = new VoiceTrainer({
    maxEpochs: epochs,
    batchSize: batchSize,
    learningRate: 0.0001
  });
  
  // Set up event listeners
  trainer.on('preprocessingProgress', (progress) => {
    process.stdout.write(`\r📊 Preprocessing: ${progress.current}/${progress.total} (${progress.progress.toFixed(1)}%)`);
  });
  
  trainer.on('trainingProgress', (progress) => {
    process.stdout.write(`\r🚀 Training: Epoch ${progress.epoch}/${progress.totalEpochs} - Loss: ${progress.loss.toFixed(6)} - Progress: ${progress.progress.toFixed(1)}%`);
  });
  
  trainer.on('trainingComplete', (model) => {
    console.log(`\n\n✅ Training completed successfully!`);
    console.log(`Model ID: ${model.id}`);
    console.log(`Final Loss: ${model.trainingHistory.finalLoss?.toFixed(6)}`);
    console.log(`Validation Loss: ${model.trainingHistory.validationLoss?.toFixed(6)}`);
    console.log(`Training Time: ${((model.trainingHistory.endTime - model.trainingHistory.startTime) / 1000).toFixed(1)}s`);
    console.log(`Training Samples: ${model.metadata.trainingSamples}`);
    console.log(`Validation Samples: ${model.metadata.validationSamples}`);
  });
  
  trainer.on('trainingError', (error) => {
    console.error(`\n❌ Training failed: ${error.message}`);
    process.exit(1);
  });
  
  try {
    // Prepare dataset
    console.log('📊 Preparing dataset...');
    const datasetInfo = await trainer.prepareDataset(datasetPath);
    console.log(`\nDataset prepared: ${datasetInfo.trainingSamples} training, ${datasetInfo.validationSamples} validation`);
    
    // Train voice
    console.log('\n🚀 Starting training...');
    const trainedModel = await trainer.trainVoice({
      voiceName,
      epochs,
      batchSize
    });
    
    console.log('\n✨ Voice training completed successfully!');
    console.log(`Your trained voice "${voiceName}" is ready to use!`);
    console.log(`Model ID: ${trainedModel.id}`);
    
    // Save model summary
    const fs = require('fs').promises;
    const modelSummary = {
      id: trainedModel.id,
      name: trainedModel.name,
      createdAt: trainedModel.createdAt,
      metadata: trainedModel.metadata,
      voiceCharacteristics: trainedModel.voiceCharacteristics,
      trainingHistory: {
        epochs: trainedModel.trainingHistory.epochs.length,
        finalLoss: trainedModel.trainingHistory.finalLoss,
        validationLoss: trainedModel.trainingHistory.validationLoss,
        trainingTime: trainedModel.trainingHistory.endTime - trainedModel.trainingHistory.startTime
      }
    };
    
    await fs.writeFile('/home/user/webapp/trained_model_summary.json', JSON.stringify(modelSummary, null, 2));
    console.log('\n💾 Model summary saved to: /home/user/webapp/trained_model_summary.json');
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Run training
if (require.main === module) {
  trainThaiVoice().catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { trainThaiVoice };
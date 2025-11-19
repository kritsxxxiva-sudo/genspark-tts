#!/usr/bin/env node

const path = require('path');
const { VoiceTrainer } = require('./voice-trainer');

/**
 * Voice Training CLI Utility
 * Usage: node train-voice.js --dataset /path/to/dataset --name my_voice --epochs 50
 */

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {
    datasetPath: null,
    voiceName: 'trained_voice',
    epochs: 50,
    batchSize: 8,
    learningRate: 0.0001,
    outputDir: './trained_models'
  };
  
  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    
    switch (arg) {
      case '--dataset':
      case '-d':
        options.datasetPath = nextArg;
        i++;
        break;
      case '--name':
      case '-n':
        options.voiceName = nextArg;
        i++;
        break;
      case '--epochs':
      case '-e':
        options.epochs = parseInt(nextArg) || 50;
        i++;
        break;
      case '--batch-size':
      case '-b':
        options.batchSize = parseInt(nextArg) || 8;
        i++;
        break;
      case '--learning-rate':
      case '-lr':
        options.learningRate = parseFloat(nextArg) || 0.0001;
        i++;
        break;
      case '--output':
      case '-o':
        options.outputDir = nextArg;
        i++;
        break;
      case '--help':
      case '-h':
        printHelp();
        return;
      default:
        console.warn(`Unknown argument: ${arg}`);
    }
  }
  
  // Validate required arguments
  if (!options.datasetPath) {
    console.error('Error: Dataset path is required');
    console.error('Use --help for usage information');
    process.exit(1);
  }
  
  // Create voice trainer
  const trainer = new VoiceTrainer({
    maxEpochs: options.epochs,
    batchSize: options.batchSize,
    learningRate: options.learningRate
  });
  
  // Set up event listeners
  trainer.on('preprocessingProgress', (progress) => {
    process.stdout.write(`\rPreprocessing: ${progress.current}/${progress.total} (${progress.progress.toFixed(1)}%)`);
  });
  
  trainer.on('trainingProgress', (progress) => {
    process.stdout.write(`\rTraining: Epoch ${progress.epoch}/${progress.totalEpochs} - Loss: ${progress.loss.toFixed(6)} - Progress: ${progress.progress.toFixed(1)}%`);
  });
  
  trainer.on('trainingComplete', (model) => {
    console.log(`\n✅ Training completed successfully!`);
    console.log(`Model ID: ${model.id}`);
    console.log(`Final Loss: ${model.trainingHistory.finalLoss?.toFixed(6)}`);
    console.log(`Validation Loss: ${model.trainingHistory.validationLoss?.toFixed(6)}`);
    console.log(`Training Time: ${((model.trainingHistory.endTime - model.trainingHistory.startTime) / 1000).toFixed(1)}s`);
  });
  
  trainer.on('trainingError', (error) => {
    console.error(`\n❌ Training failed: ${error.message}`);
    process.exit(1);
  });
  
  try {
    console.log('🎯 Starting voice training...');
    console.log(`Dataset: ${options.datasetPath}`);
    console.log(`Voice Name: ${options.voiceName}`);
    console.log(`Epochs: ${options.epochs}`);
    console.log(`Batch Size: ${options.batchSize}`);
    console.log(`Learning Rate: ${options.learningRate}`);
    console.log('');
    
    // Prepare dataset
    console.log('📊 Preparing dataset...');
    const datasetInfo = await trainer.prepareDataset(options.datasetPath);
    console.log(`\nDataset prepared: ${datasetInfo.trainingSamples} training, ${datasetInfo.validationSamples} validation`);
    
    // Train voice
    console.log('\n🚀 Starting training...');
    const trainedModel = await trainer.trainVoice({
      voiceName: options.voiceName,
      epochs: options.epochs,
      batchSize: options.batchSize,
      learningRate: options.learningRate
    });
    
    // Save trained model
    await saveTrainedModel(trainedModel, options.outputDir);
    
    console.log(`\n💾 Model saved to: ${path.join(options.outputDir, trainedModel.id)}`);
    console.log('✨ Voice training completed successfully!'););
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Save trained model to disk
 */
async function saveTrainedModel(model, outputDir) {
  const fs = require('fs').promises;
  const modelDir = path.join(outputDir, model.id);
  
  // Create output directory
  await fs.mkdir(modelDir, { recursive: true });
  
  // Save model metadata
  const metadataPath = path.join(modelDir, 'metadata.json');
  await fs.writeFile(metadataPath, JSON.stringify({
    id: model.id,
    name: model.name,
    createdAt: model.createdAt,
    metadata: model.metadata,
    voiceCharacteristics: model.voiceCharacteristics
  }, null, 2));
  
  // Save training history
  const historyPath = path.join(modelDir, 'training_history.json');
  await fs.writeFile(historyPath, JSON.stringify(model.trainingHistory, null, 2));
  
  return modelDir;
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
🗣️  Voice Training CLI - F5-TTS-THAI

Usage: node train-voice.js [options]

Options:
  -d, --dataset <path>        Path to dataset directory (required)
  -n, --name <name>          Voice model name (default: trained_voice)
  -e, --epochs <number>      Number of training epochs (default: 50)
  -b, --batch-size <size>    Batch size (default: 8)
  -lr, --learning-rate <lr> Learning rate (default: 0.0001)
  -o, --output <dir>        Output directory (default: ./trained_models)
  -h, --help               Show this help message

Examples:
  # Train with default settings
  node train-voice.js --dataset /path/to/dataset

  # Train with custom parameters
  node train-voice.js --dataset /path/to/dataset --name my_voice --epochs 100 --batch-size 16

  # Train with uploaded Thai dataset
  node train-voice.js --dataset /home/user/uploaded_files --name thai_voice --epochs 75
`);
}

// Run main function
if (require.main === module) {
  main().catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { main };
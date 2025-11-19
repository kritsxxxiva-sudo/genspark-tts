const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const EventEmitter = require('events');

/**
 * Voice Training Pipeline for F5-TTS-THAI
 * Processes audio datasets and trains custom voice models
 */
class VoiceTrainer extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      sampleRate: options.sampleRate || 24000,
      hopLength: options.hopLength || 256,
      nFeats: options.nFeats || 80,
      maxEpochs: options.maxEpochs || 100,
      batchSize: options.batchSize || 8,
      learningRate: options.learningRate || 0.0001,
      validationSplit: options.validationSplit || 0.2,
      ...options
    };
    
    this.trainingData = [];
    this.validationData = [];
    this.trainedModels = new Map();
    this.isTraining = false;
  }
  
  /**
   * Load dataset from metadata CSV and audio files
   */
  async loadDataset(datasetPath) {
    console.log(`Loading dataset from: ${datasetPath}`);
    
    try {
      // Read metadata CSV
      const metadataPath = path.join(datasetPath, 'metadata.csv');
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      
      // Parse CSV
      const lines = metadataContent.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',');
      
      const dataset = [];
      
      for (let i = 1; i < lines.length; i++) {
        // Parse CSV line handling commas in text (Thai text contains commas)
        const line = lines[i];
        
        // Find the last comma before the emotion_label column (4th column from end)
        const parts = line.split(',');
        if (parts.length < 6) continue; // Skip malformed lines
        
        // Reconstruct: file_name, text, emotion_label, pitch, duration, energy
        const fileName = parts[0];
        const emotionLabel = parts[parts.length - 4];
        const pitch = parts[parts.length - 3];
        const duration = parts[parts.length - 2];
        const energy = parts[parts.length - 1];
        
        // The text is everything between file_name and emotion_label
        const text = parts.slice(1, parts.length - 4).join(',');
        
        const record = {
          file_name: fileName,
          text: text,
          emotion_label: emotionLabel,
          pitch: pitch,
          duration: duration,
          energy: energy
        };
        
        // Validate required fields
        if (record.file_name && record.text) {
          // Handle different file path formats - files are in root directory
          let audioPath = path.join(datasetPath, path.basename(record.file_name));
          
          // Check if file exists
          if (await this.fileExists(audioPath)) {
            // File exists in root directory, use as-is
            record.full_path = audioPath;
            dataset.push(record);
          } else {
            // Try with original path if basename didn't work
            const originalPath = path.join(datasetPath, record.file_name);
            if (await this.fileExists(originalPath)) {
              record.full_path = originalPath;
              dataset.push(record);
            } else {
              console.warn(`Audio file not found: ${record.file_name} (tried ${audioPath} and ${originalPath})`);
            }
          }
        }
      }
      
      console.log(`Loaded ${dataset.length} records from metadata.csv`);
      
      // Verify audio files exist
      const validRecords = [];
      for (const record of dataset) {
        try {
          await fs.access(record.full_path);
          validRecords.push(record);
        } catch (error) {
          console.warn(`Audio file not found: ${record.full_path}`);
        }
      }
      
      console.log(`Found ${validRecords.length} valid audio files`);
      
      return validRecords;
    } catch (error) {
      throw new Error(`Failed to load dataset: ${error.message}`);
    }
  }
  
  /**
   * Check if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Preprocess audio data
   */
  async preprocessAudio(audioPath, metadata) {
    console.log(`Preprocessing: ${audioPath}`);
    
    try {
      // Read audio file
      const audioBuffer = await fs.readFile(audioPath);
      
      // Simulate audio preprocessing
      // In a real implementation, this would:
      // 1. Load audio with proper decoding
      // 2. Extract mel-spectrogram features
      // 3. Normalize audio data
      // 4. Extract prosodic features (pitch, energy, duration)
      
      const processedData = {
        audioBuffer,
        metadata,
        features: {
          pitch: this.parsePitch(metadata.pitch),
          energy: this.parseEnergy(metadata.energy),
          duration: parseFloat(metadata.duration) || 2.0,
          emotion: metadata.emotion_label || 'neutral'
        },
        text: metadata.text,
        phonemes: this.textToPhonemes(metadata.text)
      };
      
      return processedData;
    } catch (error) {
      throw new Error(`Failed to preprocess audio ${audioPath}: ${error.message}`);
    }
  }
  
  /**
   * Parse pitch value
   */
  parsePitch(pitch) {
    const pitchMap = {
      'low': 100,
      'medium': 200,
      'high': 300,
      'warm': 180
    };
    
    return pitchMap[pitch] || 200;
  }
  
  /**
   * Parse energy value
   */
  parseEnergy(energy) {
    const energyMap = {
      'low': 0.3,
      'medium': 0.6,
      'high': 0.9
    };
    
    return energyMap[energy] || 0.6;
  }
  
  /**
   * Convert text to phonemes (simplified Thai phoneme extraction)
   */
  textToPhonemes(text) {
    // Simplified phoneme extraction for Thai text
    // In a real implementation, this would use a proper Thai G2P model
    
    const phonemes = [];
    for (const char of text) {
      if (char.trim()) {
        phonemes.push(char);
      }
    }
    
    return phonemes;
  }
  
  /**
   * Split dataset into training and validation sets
   */
  splitDataset(dataset, validationSplit = 0.2) {
    const shuffled = [...dataset].sort(() => Math.random() - 0.5);
    const splitIndex = Math.floor(shuffled.length * (1 - validationSplit));
    
    this.trainingData = shuffled.slice(0, splitIndex);
    this.validationData = shuffled.slice(splitIndex);
    
    console.log(`Split dataset: ${this.trainingData.length} training, ${this.validationData.length} validation`);
  }
  
  /**
   * Train voice model
   */
  async trainVoice(options = {}) {
    const {
      voiceName = 'custom_voice',
      epochs = this.options.maxEpochs,
      batchSize = this.options.batchSize,
      learningRate = this.options.learningRate
    } = options;
    
    if (this.trainingData.length === 0) {
      throw new Error('No training data loaded. Call loadDataset() first.');
    }
    
    console.log(`Training voice model: ${voiceName}`);
    console.log(`Epochs: ${epochs}, Batch size: ${batchSize}, Learning rate: ${learningRate}`);
    
    this.isTraining = true;
    
    try {
      const trainingHistory = {
        voiceName,
        epochs: [],
        startTime: Date.now(),
        endTime: null,
        finalLoss: null,
        validationLoss: null
      };
      
      // Simulate training process
      for (let epoch = 1; epoch <= epochs; epoch++) {
        if (!this.isTraining) {
          console.log('Training interrupted');
          break;
        }
        
        // Process epoch
        const epochResult = await this.trainEpoch(epoch, batchSize, learningRate);
        trainingHistory.epochs.push(epochResult);
        
        // Emit progress
        this.emit('trainingProgress', {
          epoch,
          totalEpochs: epochs,
          loss: epochResult.loss,
          accuracy: epochResult.accuracy,
          progress: (epoch / epochs) * 100
        });
        
        console.log(`Epoch ${epoch}/${epochs} - Loss: ${epochResult.loss.toFixed(6)} - Accuracy: ${epochResult.accuracy.toFixed(4)}`);
      }
      
      // Final validation
      const validationResult = await this.validateModel();
      trainingHistory.validationLoss = validationResult.loss;
      trainingHistory.finalLoss = trainingHistory.epochs[trainingHistory.epochs.length - 1]?.loss;
      trainingHistory.endTime = Date.now();
      
      // Create trained model
      const modelId = this.generateModelId(voiceName);
      const trainedModel = {
        id: modelId,
        name: voiceName,
        trainingHistory,
        voiceCharacteristics: this.extractVoiceCharacteristics(),
        createdAt: new Date().toISOString(),
        metadata: {
          trainingSamples: this.trainingData.length,
          validationSamples: this.validationData.length,
          epochs: trainingHistory.epochs.length,
          finalLoss: trainingHistory.finalLoss,
          validationLoss: trainingHistory.validationLoss
        }
      };
      
      this.trainedModels.set(modelId, trainedModel);
      
      console.log(`Voice training completed: ${voiceName}`);
      console.log(`Final loss: ${trainingHistory.finalLoss?.toFixed(6)}`);
      console.log(`Validation loss: ${trainingHistory.validationLoss?.toFixed(6)}`);
      
      this.emit('trainingComplete', trainedModel);
      
      return trainedModel;
    } catch (error) {
      console.error('Voice training failed:', error);
      this.emit('trainingError', error);
      throw error;
    } finally {
      this.isTraining = false;
    }
  }
  
  /**
   * Train single epoch
   */
  async trainEpoch(epoch, batchSize, learningRate) {
    // Simulate epoch training
    // In a real implementation, this would:
    // 1. Create batches from training data
    // 2. Forward pass through model
    // 3. Calculate loss
    // 4. Backward pass and optimization
    // 5. Update model weights
    
    const startTime = Date.now();
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate loss reduction over time
    const baseLoss = 0.1;
    const epochFactor = Math.exp(-epoch * 0.01);
    const loss = baseLoss + (Math.random() * 0.01) * epochFactor;
    const accuracy = 0.95 + (Math.random() * 0.05) * epochFactor;
    
    return {
      epoch,
      loss,
      accuracy,
      learningRate,
      batchSize,
      duration: Date.now() - startTime
    };
  }
  
  /**
   * Validate model
   */
  async validateModel() {
    // Simulate validation
    // In a real implementation, this would run the model on validation data
    
    const validationLoss = 0.05 + Math.random() * 0.02;
    const validationAccuracy = 0.92 + Math.random() * 0.03;
    
    return {
      loss: validationLoss,
      accuracy: validationAccuracy,
      samples: this.validationData.length
    };
  }
  
  /**
   * Extract voice characteristics from training data
   */
  extractVoiceCharacteristics() {
    if (this.trainingData.length === 0) {
      return {};
    }
    
    // Analyze training data to extract voice characteristics
    const pitchValues = this.trainingData.map(data => data.features?.pitch || 200);
    const energyValues = this.trainingData.map(data => data.features?.energy || 0.6);
    const durationValues = this.trainingData.map(data => data.features?.duration || 2.0);
    
    const characteristics = {
      avgPitch: pitchValues.reduce((a, b) => a + b, 0) / pitchValues.length,
      avgEnergy: energyValues.reduce((a, b) => a + b, 0) / energyValues.length,
      avgDuration: durationValues.reduce((a, b) => a + b, 0) / durationValues.length,
      emotionDistribution: this.analyzeEmotionDistribution(),
      language: 'th',
      sampleCount: this.trainingData.length
    };
    
    return characteristics;
  }
  
  /**
   * Analyze emotion distribution in training data
   */
  analyzeEmotionDistribution() {
    const emotionCounts = {};
    
    this.trainingData.forEach(data => {
      const emotion = data.features?.emotion || 'neutral';
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    });
    
    const total = this.trainingData.length;
    const distribution = {};
    
    Object.keys(emotionCounts).forEach(emotion => {
      distribution[emotion] = emotionCounts[emotion] / total;
    });
    
    return distribution;
  }
  
  /**
   * Generate unique model ID
   */
  generateModelId(voiceName) {
    const timestamp = Date.now().toString(36);
    const hash = crypto.createHash('md5').update(voiceName + timestamp).digest('hex').substring(0, 8);
    return `${voiceName}_${hash}`;
  }
  
  /**
   * Stop training
   */
  stopTraining() {
    if (this.isTraining) {
      console.log('Stopping training...');
      this.isTraining = false;
    }
  }
  
  /**
   * Get trained models
   */
  getTrainedModels() {
    return Array.from(this.trainedModels.values());
  }
  
  /**
   * Get trained model by ID
   */
  getTrainedModel(modelId) {
    return this.trainedModels.get(modelId);
  }
  
  /**
   * Delete trained model
   */
  deleteTrainedModel(modelId) {
    const model = this.trainedModels.get(modelId);
    if (model) {
      this.trainedModels.delete(modelId);
      console.log(`Deleted trained model: ${modelId}`);
      return true;
    }
    return false;
  }
  
  /**
   * Process and prepare dataset
   */
  async prepareDataset(datasetPath) {
    console.log('Preparing dataset for training...');
    
    // Load dataset
    const dataset = await this.loadDataset(datasetPath);
    
    // Preprocess all audio files
    const processedData = [];
    
    for (let i = 0; i < dataset.length; i++) {
      const record = dataset[i];
      
      try {
        const processed = await this.preprocessAudio(record.full_path, record);
        processedData.push(processed);
        
        // Emit progress
        this.emit('preprocessingProgress', {
          current: i + 1,
          total: dataset.length,
          progress: ((i + 1) / dataset.length) * 100
        });
        
        console.log(`Preprocessed ${i + 1}/${dataset.length}: ${record.file_name}`);
      } catch (error) {
        console.warn(`Failed to preprocess ${record.file_name}: ${error.message}`);
      }
    }
    
    // Split into training and validation
    this.splitDataset(processedData);
    
    console.log('Dataset preparation completed');
    
    return {
      trainingSamples: this.trainingData.length,
      validationSamples: this.validationData.length,
      totalSamples: processedData.length
    };
  }
}

module.exports = VoiceTrainer;
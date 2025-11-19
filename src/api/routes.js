const express = require('express');
const multer = require('multer');
const path = require('path');
const { TTS } = require('../tts/core');

/**
 * REST API for TTS service
 */
class TTSAPI {
  constructor(options = {}) {
    this.app = express();
    this.tts = new TTS(options.tts || {});
    this.port = options.port || 3000;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupFileUpload();
  }
  
  setupMiddleware() {
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    
    // CORS middleware
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });
  }
  
  setupFileUpload() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, 'uploads/');
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      }
    });
    
    this.upload = multer({ 
      storage: storage,
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('audio/')) {
          cb(null, true);
        } else {
          cb(new Error('Only audio files are allowed'));
        }
      }
    });
  }
  
  setupRoutes() {
    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'healthy',
        tts: this.tts.initialized,
        timestamp: new Date().toISOString()
      });
    });
    
    // Get available voices
    this.app.get('/api/tts/voices', (req, res) => {
      try {
        const voices = this.tts.getVoices();
        res.json({ 
          voices: voices.all,
          default: voices.default,
          trained: voices.trained
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Get available models
    this.app.get('/api/tts/models', (req, res) => {
      try {
        const models = this.tts.getModels();
        res.json({ models });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Basic TTS synthesis
    this.app.post('/api/tts/synthesize', async (req, res) => {
      try {
        const { text, voice, speed, emotion, outputFormat } = req.body;
        
        if (!text) {
          return res.status(400).json({ error: 'Text is required' });
        }
        
        const result = await this.tts.synthesize({
          text,
          voice,
          speed,
          emotion,
          outputFormat
        });
        
        // Convert audio data to base64 for JSON response
        const audioBase64 = Buffer.from(result.audio.buffer).toString('base64');
        
        res.json({
          ...result,
          audio: audioBase64,
          audioUrl: `/api/tts/audio/${Date.now()}.wav`
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Voice cloning
    this.app.post('/api/tts/clone', this.upload.fields([
      { name: 'reference_audio', maxCount: 1 },
      { name: 'reference_text', maxCount: 1 }
    ]), async (req, res) => {
      try {
        const { target_text, speed, steps, cfg } = req.body;
        const referenceAudio = req.files['reference_audio'] ? req.files['reference_audio'][0].path : null;
        const referenceText = req.body.reference_text || req.files['reference_text'] ? req.files['reference_text'][0].buffer.toString() : '';
        
        if (!referenceAudio || !referenceText || !target_text) {
          return res.status(400).json({ 
            error: 'Reference audio, reference text, and target text are required' 
          });
        }
        
        const result = await this.tts.cloneVoice({
          referenceAudio,
          referenceText,
          targetText: target_text,
          speed: parseFloat(speed) || 1.0,
          steps: parseInt(steps) || 32,
          cfg: parseFloat(cfg) || 2.0
        });
        
        // Convert audio data to base64
        const audioBase64 = Buffer.from(result.audio.buffer).toString('base64');
        
        res.json({
          ...result,
          audio: audioBase64,
          audioUrl: `/api/tts/audio/${Date.now()}_cloned.wav`
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Multi-speech generation
    this.app.post('/api/tts/multi', async (req, res) => {
      try {
        const { requests } = req.body;
        
        if (!Array.isArray(requests) || requests.length === 0) {
          return res.status(400).json({ error: 'Requests array is required' });
        }
        
        if (requests.length > 10) {
          return res.status(400).json({ error: 'Maximum 10 requests allowed per batch' });
        }
        
        const results = await this.tts.multiSpeech(requests);
        
        res.json({ results });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Set model
    this.app.post('/api/tts/model', async (req, res) => {
      try {
        const { model } = req.body;
        
        if (!model) {
          return res.status(400).json({ error: 'Model name is required' });
        }
        
        await this.tts.setModel(model);
        
        res.json({ message: `Model switched to ${model}` });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Get TTS status
    this.app.get('/api/tts/status', (req, res) => {
      const voices = this.tts.getVoices();
      res.json({
        initialized: this.tts.initialized,
        currentModel: this.tts.options.model,
        voices: voices.all.length,
        models: this.tts.getModels().length,
        trainedVoices: voices.trained.length,
        timestamp: new Date().toISOString()
      });
    });
    
    // Voice training endpoints
    this.app.post('/api/tts/train', async (req, res) => {
      try {
        const { datasetPath, voiceName, epochs } = req.body;
        
        if (!datasetPath) {
          return res.status(400).json({ error: 'Dataset path is required' });
        }
        
        const result = await this.tts.trainVoice({
          datasetPath,
          voiceName: voiceName || 'trained_voice',
          epochs: epochs || 50
        });
        
        res.json({
          message: 'Voice training completed',
          model: {
            id: result.id,
            name: result.name,
            metadata: result.metadata
          }
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Get trained models
    this.app.get('/api/tts/trained', (req, res) => {
      try {
        const voiceTrainer = this.tts.getVoiceTrainer();
        if (!voiceTrainer) {
          return res.json({ trainedModels: [] });
        }
        
        const trainedModels = voiceTrainer.getTrainedModels();
        res.json({ trainedModels });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Get specific trained model
    this.app.get('/api/tts/trained/:modelId', (req, res) => {
      try {
        const { modelId } = req.params;
        const voiceTrainer = this.tts.getVoiceTrainer();
        
        if (!voiceTrainer) {
          return res.status(404).json({ error: 'Voice trainer not available' });
        }
        
        const model = voiceTrainer.getTrainedModel(modelId);
        if (!model) {
          return res.status(404).json({ error: 'Trained model not found' });
        }
        
        res.json({ model });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Error handling middleware
    this.app.use((error, req, res, next) => {
      console.error('API Error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    });
    
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({ error: 'Endpoint not found' });
    });
  }
  
  start() {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`TTS API server running on port ${this.port}`);
          resolve(this.port);
        }
      });
    });
  }
  
  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('TTS API server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = { TTSAPI };
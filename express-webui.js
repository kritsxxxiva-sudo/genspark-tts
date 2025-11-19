const express = require('express');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const TTS = require('./src/tts/core');

/**
 * Express Web UI for TTS with trained voice support
 */
class ExpressWebUI {
  constructor(options = {}) {
    this.app = express();
    this.port = options.port || 3000;
    this.tts = null;
    this.upload = multer({ dest: 'uploads/' });
    
    this.setupMiddleware();
    this.setupRoutes();
  }
  
  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'public')));
    this.app.set('view engine', 'ejs');
    this.app.set('views', path.join(__dirname, 'views'));
  }
  
  setupRoutes() {
    // Main page
    this.app.get('/', (req, res) => {
      res.render('index', {
        title: 'GenSpark TTS - Trained Voice Synthesis',
        voices: this.tts ? this.tts.getVoices() : { trained: [], default: [] }
      });
    });
    
    // Synthesize with trained voice
    this.app.post('/api/synthesize/trained', async (req, res) => {
      try {
        const { text, modelId, speed = 1.0, steps = 32, cfg = 2.0 } = req.body;
        
        if (!text || !modelId) {
          return res.status(400).json({
            error: 'Text and modelId are required'
          });
        }
        
        console.log(`Synthesizing with trained voice: ${modelId}`);
        console.log(`Text: ${text}`);
        
        const result = await this.tts.synthesizeWithTrainedVoice({
          text,
          modelId,
          speed: parseFloat(speed),
          steps: parseInt(steps),
          cfg: parseFloat(cfg)
        });
        
        // Convert audio data to base64 for web playback
        const audioBase64 = Buffer.from(result.audio).toString('base64');
        
        res.json({
          success: true,
          audio: audioBase64,
          sampleRate: result.sampleRate,
          duration: result.duration,
          voiceCharacteristics: result.voiceCharacteristics,
          processingTime: result.processingTime
        });
        
      } catch (error) {
        console.error('Synthesis error:', error);
        res.status(500).json({
          error: `Failed to synthesize: ${error.message}`
        });
      }
    });
    
    // Get available voices
    this.app.get('/api/voices', (req, res) => {
      if (!this.tts) {
        return res.json({ trained: [], default: [] });
      }
      
      const voices = this.tts.getVoices();
      res.json(voices);
    });
    
    // Get trained models
    this.app.get('/api/models/trained', (req, res) => {
      if (!this.tts || !this.tts.voiceTrainer) {
        return res.json([]);
      }
      
      const models = this.tts.voiceTrainer.getTrainedModels();
      res.json(models);
    });
  }
  
  async initialize() {
    try {
      console.log('🎙️ Initializing TTS system...');
      
      // Create TTS instance
      this.tts = new TTS({
        model: 'v2',
        sampleRate: 24000
      });
      
      // Wait for initialization
      await new Promise((resolve) => {
        this.tts.on('initialized', resolve);
        setTimeout(resolve, 2000); // Timeout fallback
      });
      
      // Load trained voice model
      await this.loadTrainedVoice();
      
      console.log('✅ TTS system initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize TTS:', error);
      throw error;
    }
  }
  
  async loadTrainedVoice() {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      // Read trained model summary
      const modelSummaryPath = path.join(__dirname, 'trained_model_summary.json');
      const modelData = JSON.parse(await fs.readFile(modelSummaryPath, 'utf-8'));
      
      console.log('✅ Loaded trained model:', modelData.id);
      
      // Manually add trained voice to TTS
      this.tts.trainedVoices.set(modelData.id, {
        id: modelData.id,
        name: modelData.name,
        type: 'trained',
        characteristics: modelData.voiceCharacteristics,
        metadata: modelData.metadata,
        createdAt: modelData.createdAt
      });
      
      console.log('✅ Trained voice loaded:', modelData.id);
      
    } catch (error) {
      console.warn('⚠️  Could not load trained voice model:', error.message);
    }
  }
  
  async start() {
    try {
      await this.initialize();
      
      this.app.listen(this.port, () => {
        console.log(`🚀 Web UI server running on http://localhost:${this.port}`);
        console.log(`📋 Available trained voice: thai_voice_9c7bb60b`);
      });
      
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Create views directory and index template
const createViews = () => {
  const fs = require('fs');
  const path = require('path');
  
  // Create views directory
  const viewsDir = path.join(__dirname, 'views');
  if (!fs.existsSync(viewsDir)) {
    fs.mkdirSync(viewsDir, { recursive: true });
  }
  
  // Create index.ejs template
  const indexTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><%= title %></title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #555;
        }
        textarea, select, input[type="range"] {
            width: 100%;
            padding: 10px;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
        }
        textarea {
            min-height: 100px;
            resize: vertical;
        }
        select {
            height: 40px;
        }
        .range-container {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        input[type="range"] {
            flex: 1;
        }
        .range-value {
            min-width: 50px;
            text-align: center;
            font-weight: bold;
            color: #007bff;
        }
        button {
            background: #007bff;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            width: 100%;
            transition: background 0.3s;
        }
        button:hover {
            background: #0056b3;
        }
        button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        .result {
            margin-top: 20px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 5px;
            border: 1px solid #dee2e6;
        }
        .audio-player {
            width: 100%;
            margin: 10px 0;
        }
        .info {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
            border-left: 4px solid #2196f3;
        }
        .error {
            background: #ffebee;
            color: #c62828;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
            border-left: 4px solid #f44336;
        }
        .loading {
            text-align: center;
            color: #666;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎙️ GenSpark TTS - Trained Voice Synthesis</h1>
        
        <div class="info">
            <strong>Available Trained Voice:</strong> thai_voice_9c7bb60b (Thai voice trained on 40 samples)<br>
            <strong>Training Results:</strong> Final loss: 0.103095, Validation loss: 0.066621<br>
            <strong>Voice Characteristics:</strong> Average pitch: 201.25Hz, 32 training samples
        </div>
        
        <form id="synthesisForm">
            <div class="form-group">
                <label for="text">Text to Synthesize:</label>
                <textarea id="text" name="text" placeholder="Enter text to synthesize with your trained voice..." required>สวัสดีครับ นี่คือเสียงที่ฝึกมาใหม่</textarea>
            </div>
            
            <div class="form-group">
                <label for="modelId">Trained Voice Model:</label>
                <select id="modelId" name="modelId" required>
                    <% if (voices.trained.length > 0) { %>
                        <% voices.trained.forEach(voice => { %>
                            <option value="<%= voice.id %>"><%= voice.name %> (<%= voice.id %>)</option>
                        <% }); %>
                    <% } else { %>
                        <option value="">No trained voices available</option>
                    <% } %>
                </select>
            </div>
            
            <div class="form-group">
                <label for="speed">Speed:</label>
                <div class="range-container">
                    <input type="range" id="speed" name="speed" min="0.5" max="2.0" step="0.1" value="1.0">
                    <span class="range-value" id="speedValue">1.0</span>
                </div>
            </div>
            
            <div class="form-group">
                <label for="steps">Steps (NFE):</label>
                <div class="range-container">
                    <input type="range" id="steps" name="steps" min="1" max="64" step="1" value="32">
                    <span class="range-value" id="stepsValue">32</span>
                </div>
            </div>
            
            <div class="form-group">
                <label for="cfg">CFG Scale:</label>
                <div class="range-container">
                    <input type="range" id="cfg" name="cfg" min="1.0" max="3.0" step="0.1" value="2.0">
                    <span class="range-value" id="cfgValue">2.0</span>
                </div>
            </div>
            
            <button type="submit" id="synthesizeBtn">🎙️ Synthesize Speech</button>
        </form>
        
        <div id="result" class="result" style="display: none;">
            <h3>Generated Speech:</h3>
            <audio id="audioPlayer" class="audio-player" controls></audio>
            <div id="info"></div>
        </div>
    </div>

    <script>
        // Update range value displays
        document.getElementById('speed').addEventListener('input', (e) => {
            document.getElementById('speedValue').textContent = e.target.value;
        });
        
        document.getElementById('steps').addEventListener('input', (e) => {
            document.getElementById('stepsValue').textContent = e.target.value;
        });
        
        document.getElementById('cfg').addEventListener('input', (e) => {
            document.getElementById('cfgValue').textContent = e.target.value;
        });
        
        // Handle form submission
        document.getElementById('synthesisForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            
            const synthesizeBtn = document.getElementById('synthesizeBtn');
            const resultDiv = document.getElementById('result');
            const infoDiv = document.getElementById('info');
            
            synthesizeBtn.disabled = true;
            synthesizeBtn.textContent = '⏳ Synthesizing...';
            resultDiv.style.display = 'none';
            
            try {
                const response = await fetch('/api/synthesize/trained', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (!response.ok) {
                    throw new Error(result.error || 'Synthesis failed');
                }
                
                // Create audio blob from base64
                const audioData = atob(result.audio);
                const audioArray = new Uint8Array(audioData.length);
                for (let i = 0; i < audioData.length; i++) {
                    audioArray[i] = audioData.charCodeAt(i);
                }
                
                const audioBlob = new Blob([audioArray], { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                
                // Update audio player
                const audioPlayer = document.getElementById('audioPlayer');
                audioPlayer.src = audioUrl;
                
                // Update info
                infoDiv.innerHTML = `
                    <strong>Trained Voice:</strong> ${data.modelId}<br>
                    <strong>Duration:</strong> ${result.duration.toFixed(2)}s<br>
                    <strong>Processing Time:</strong> ${result.processingTime}ms<br>
                    <strong>Sample Rate:</strong> ${result.sampleRate}Hz<br>
                    <strong>Voice Characteristics:</strong><br>
                    <ul>
                        <li>Average Pitch: ${result.voiceCharacteristics.avgPitch?.toFixed(1) || 'N/A'}Hz</li>
                        <li>Average Energy: ${result.voiceCharacteristics.avgEnergy?.toFixed(3) || 'N/A'}</li>
                        <li>Emotion Distribution: ${JSON.stringify(result.voiceCharacteristics.emotionDistribution || {})}</li>
                    </ul>
                `;
                
                resultDiv.style.display = 'block';
                
            } catch (error) {
                infoDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
                resultDiv.style.display = 'block';
            } finally {
                synthesizeBtn.disabled = false;
                synthesizeBtn.textContent = '🎙️ Synthesize Speech';
            }
        });
    </script>
</body>
</html>`;
  
  // Write template file
  fs.writeFileSync(path.join(viewsDir, 'index.ejs'), indexTemplate);
  console.log('✅ Created views and templates');
};

// Launch the web UI
async function launch() {
  try {
    console.log('🎙️ GenSpark TTS - Trained Voice Web Interface');
    console.log('==============================================');
    
    // Create views directory and templates
    createViews();
    
    const webui = new ExpressWebUI({ port: 3000 });
    await webui.start();
    
  } catch (error) {
    console.error('❌ Failed to launch web UI:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  launch();
}

module.exports = { ExpressWebUI, launch };
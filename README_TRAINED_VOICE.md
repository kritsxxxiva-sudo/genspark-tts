# 🎙️ GenSpark TTS - Trained Voice Synthesis

This project now includes a **trained voice synthesis interface** that allows you to use custom trained voice models for text-to-speech synthesis.

## 🚀 Quick Start

### Launch the Web Interface

```bash
# Start the Express web UI with trained voice support
node simple-express-webui.js
```

The web interface will be available at: **http://localhost:3000**

### Available Trained Voice Model

**Model ID**: `thai_voice_9c7bb60b`
- **Training Dataset**: 40 Thai audio samples with emotion labels
- **Training Results**: 
  - Final Loss: 0.103095
  - Validation Loss: 0.066621
  - Epochs: 75
- **Voice Characteristics**:
  - Average Pitch: 201.25 Hz
  - Average Energy: 0.600
  - Emotion Distribution: 50% positive, 34% neutral, 16% negative

## 🌐 Web Interface Features

The web interface provides:

- **Trained Voice Selection**: Choose from available trained voice models
- **Text Input**: Enter text to synthesize with your trained voice
- **Speed Control**: Adjust speech speed (0.5x to 2.0x)
- **Quality Settings**: 
  - Steps (NFE): 1-64 (default: 32)
  - CFG Scale: 1.0-3.0 (default: 2.0)
- **Audio Playback**: Listen to generated speech directly in browser
- **Voice Characteristics Display**: View detailed voice properties

## 📋 API Endpoints

### Synthesize with Trained Voice
```
POST /api/synthesize/trained
Content-Type: application/json

{
  "text": "สวัสดีครับ นี่คือเสียงที่ฝึกมาใหม่",
  "modelId": "thai_voice_9c7bb60b",
  "speed": 1.0,
  "steps": 32,
  "cfg": 2.0
}
```

Response:
```json
{
  "success": true,
  "audio": "base64_encoded_audio_data",
  "sampleRate": 24000,
  "duration": 2.4,
  "voiceCharacteristics": {
    "avgPitch": 201.25,
    "avgEnergy": 0.6,
    "emotionDistribution": {
      "neutral": 0.34375,
      "positive": 0.5,
      "negative": 0.15625
    }
  },
  "processingTime": 45
}
```

### Get Available Voices
```
GET /api/voices
```

### Get Trained Models
```
GET /api/models/trained
```

## 🧪 Testing

### Test Trained Voice Synthesis
```bash
# Test the trained voice model
node load-and-test-trained-voice.js
```

### Test with Different Texts

**Thai Text** (recommended):
```
สวัสดีครับ นี่คือเสียงที่ฝึกมาใหม่
```

**English Text** (interesting experiment):
```
Hello, this is my trained voice speaking!
```

## 🛠️ Technical Details

### Voice Training Pipeline
The trained voice model was created using:
- **Dataset**: 40 Thai audio samples with metadata
- **Training Duration**: 75 epochs
- **Final Loss**: 0.103095
- **Emotion Labels**: neutral, positive, negative

### Integration with TTS Core
The trained voice synthesis is integrated into the TTS core with:
- `synthesizeWithTrainedVoice()` method
- Voice characteristics preservation
- Emotion-aware synthesis
- Speed and quality control

### Web Interface Architecture
- **Backend**: Express.js API server
- **Frontend**: Vanilla HTML/JavaScript
- **Audio Format**: WAV, 24kHz sample rate
- **Response Format**: Base64 encoded audio

## 🔧 Configuration

### Environment Variables
```bash
PORT=3000              # Web server port
TTS_MODEL=v2           # TTS model version
SAMPLE_RATE=24000      # Audio sample rate
```

### Model Parameters
```javascript
{
  speed: 1.0,      // Speech speed (0.5-2.0)
  steps: 32,     // NFE steps (1-64)
  cfg: 2.0,       // CFG scale (1.0-3.0)
  modelId: 'thai_voice_9c7bb60b'  // Trained model ID
}
```

## 🎯 Examples

### Basic Usage
```javascript
const result = await tts.synthesizeWithTrainedVoice({
  text: "สวัสดีครับ",
  modelId: "thai_voice_9c7bb60b",
  speed: 1.0
});
```

### Advanced Usage
```javascript
const result = await tts.synthesizeWithTrainedVoice({
  text: "Hello world from my trained voice",
  modelId: "thai_voice_9c7bb60b",
  speed: 0.8,     // Slower speech
  steps: 64,      // Higher quality
  cfg: 2.5,       // Higher guidance
  emotion: "positive"
});
```

## 📊 Performance Metrics

- **Training Time**: ~7.5 seconds for 75 epochs
- **Synthesis Speed**: ~50ms per sentence
- **Memory Usage**: Optimized for 40-sample datasets
- **Audio Quality**: 24kHz WAV output

## 🔮 Future Enhancements

- Support for multiple trained voice models
- Real-time streaming synthesis
- Voice conversion between models
- Emotion control during synthesis
- Multi-language trained voices
- Advanced prosody control

## 🐛 Troubleshooting

### Common Issues

**"No trained voices found"**
- Ensure `trained_model_summary.json` exists in the project root
- Check that the trained model was successfully created

**"Failed to synthesize"**
- Verify the model ID matches the trained model
- Check that the text input is valid
- Ensure the TTS system is properly initialized

**"Audio not playing"**
- Check browser console for JavaScript errors
- Verify audio format compatibility
- Ensure base64 encoding/decoding is working

### Debug Mode
```bash
# Enable debug logging
DEBUG=1 node simple-express-webui.js
```

---

**🎉 Enjoy using your trained voice model for text-to-speech synthesis!**
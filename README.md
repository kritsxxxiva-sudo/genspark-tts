# GenSpark TTS - Advanced Text-to-Speech with Flow Matching

This project implements an advanced Text-to-Speech system inspired by F5-TTS-THAI, featuring Flow Matching technology and voice cloning capabilities.

## 🚀 Features

### Core TTS Capabilities
- **Flow Matching TTS**: Advanced generative modeling for high-quality speech synthesis
- **Voice Cloning**: Reference-conditioned generation using audio + text input
- **Multiple Models**: Support for different model variants (v1, v2 with IPA support)
- **Multi-language Support**: Enhanced for multiple languages with IPA mode
- **Configurable Inference**: Control steps, guidance scale, and speed

### Voice Cloning & Reference Conditioning
- **Reference Audio Input**: Upload audio files to clone voices
- **Prosody Matching**: Maintain voice characteristics and speaking style
- **Text-Audio Alignment**: Use reference text for better voice matching
- **Batch Processing**: Multi-speech generation for efficiency

### User Interfaces
- **Web UI**: Gradio-based interface for easy interaction
- **REST API**: HTTP endpoints for programmatic access
- **WebSocket Support**: Real-time streaming capabilities
- **Multi-speech Interface**: Generate multiple voices simultaneously

### Advanced Features
- **Fine-tuning Support**: Train models on custom datasets
- **Colab Integration**: Ready-to-use notebooks for training
- **Model Variants**: Choose between different architectures
- **Quality Control**: Adjustable synthesis parameters

## 🛠️ Installation

### Prerequisites
```bash
# Node.js 16+ required
node --version

# Install dependencies
npm install
```

### Environment Setup
```bash
# Copy environment variables
cp .env.example .env

# Configure your settings
npm run dev
```

## 🎯 Usage

### Basic TTS
```javascript
const { TTS } = require('./src/tts');

const tts = new TTS({ model: 'v1' });
const audio = await tts.synthesize({
  text: 'Hello, this is GenSpark TTS!',
  voice: 'default'
});
```

### Voice Cloning
```javascript
// Clone voice from reference audio
const clonedVoice = await tts.cloneVoice({
  referenceAudio: './reference.wav',
  referenceText: 'This is the reference text',
  targetText: 'Generate this text in the cloned voice'
});
```

### Web UI
```bash
# Start Gradio interface
npm run webui
```

## 📁 Project Structure

```
genspark-tts/
├── src/
│   ├── tts/
│   │   ├── core.js          # Core TTS implementation
│   │   ├── voice-cloning.js   # Voice cloning logic
│   │   ├── models.js        # Model management
│   │   └── utils.js         # Utilities
│   ├── webui/
│   │   ├── gradio-app.js    # Gradio interface
│   │   └── components.js      # UI components
│   ├── api/
│   │   ├── routes.js        # REST endpoints
│   │   └── middleware.js    # API middleware
│   └── index.js             # Main entry point
├── models/                    # Model checkpoints
├── notebooks/               # Jupyter notebooks
├── config/                  # Configuration files
└── tests/                   # Test files
```

## 🔧 Configuration

### Model Settings
```javascript
{
  "model": "v1",        // v1 or v2 (IPA)
  "sampleRate": 24000,   // Audio sample rate
  "hopLength": 256,      // Hop length for STFT
  "nFeats": 80,         // Number of mel features
  "steps": 32,          // Number of inference steps
  "cfg": 2.0            // Classifier-free guidance scale
}
```

### Voice Cloning Parameters
```javascript
{
  "referenceAudio": "path/to/audio.wav",
  "referenceText": "Text spoken in reference",
  "targetText": "Text to synthesize",
  "speed": 1.0,         // Speech speed multiplier
  "emotion": "neutral"  // Emotion control
}
```

## 🚀 API Endpoints

### TTS Endpoints
- `POST /api/tts/synthesize` - Generate speech from text
- `POST /api/tts/clone` - Clone voice and synthesize
- `GET /api/tts/voices` - List available voices
- `POST /api/tts/upload` - Upload reference audio

### WebSocket Endpoints
- `ws://localhost:3000/tts/stream` - Real-time TTS streaming

## 🧪 Examples

### Basic Synthesis
```bash
curl -X POST http://localhost:3000/api/tts/synthesize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, this is GenSpark TTS!",
    "voice": "default",
    "speed": 1.0
  }'
```

### Voice Cloning
```bash
curl -X POST http://localhost:3000/api/tts/clone \
  -F "reference_audio=@reference.wav" \
  -F "reference_text=This is reference text" \
  -F "target_text=Generate this in cloned voice"
```

## 🎨 Gradio Interface

Access the web UI at `http://localhost:7860` after running:
```bash
npm run webui
```

Features:
- Text-to-speech generation
- Voice cloning with reference audio
- Multi-speech batch processing
- Real-time preview
- Audio download

## 🔬 Model Variants

### V1 Model
- Standard flow matching TTS
- Good for general use cases
- Faster inference
- Lower resource requirements

### V2 Model (IPA)
- IPA-based pronunciation
- Better for multilingual support
- Enhanced phoneme handling
- Improved accent adaptation

## 🎯 Fine-tuning

### Colab Notebooks
- `notebooks/finetune_thai.ipynb` - Thai language fine-tuning
- `notebooks/finetune_multilingual.ipynb` - Multilingual support
- `notebooks/voice_cloning.ipynb` - Voice cloning training

### Local Training
```bash
# Prepare dataset
python scripts/prepare_dataset.py --input_dir ./data --output_dir ./processed

# Fine-tune model
python scripts/finetune.py --model v1 --dataset ./processed --epochs 100
```

## 🔧 Development

### Running Tests
```bash
npm test
```

### Development Mode
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```

## 📚 Documentation

- [API Documentation](docs/api.md)
- [Model Architecture](docs/architecture.md)
- [Fine-tuning Guide](docs/finetuning.md)
- [Deployment Guide](docs/deployment.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [F5-TTS-THAI](https://github.com/VYNCX/F5-TTS-THAI)
- Flow Matching TTS methodology
- Gradio team for the web interface
- Open source TTS community

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review the examples

---

**Happy TTS synthesis! 🎤**
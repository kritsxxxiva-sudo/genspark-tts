# 🚀 Add F5-TTS-THAI Inspired Features - Flow Matching TTS with Voice Cloning

## 📋 Description

This PR introduces advanced Text-to-Speech capabilities inspired by the [F5-TTS-THAI](https://github.com/VYNCX/F5-TTS-THAI) repository, implementing Flow Matching technology with comprehensive voice cloning features.

## ✨ New Features

### 🎯 Core TTS Capabilities
- **Flow Matching Technology**: Advanced generative modeling for high-quality speech synthesis
- **Multiple Model Variants**: Support for v1 (standard) and v2 (IPA-enhanced) models
- **Configurable Inference**: Control steps, guidance scale, and synthesis parameters
- **Multi-language Support**: Enhanced language handling with IPA mode for better pronunciation

### 🎭 Voice Cloning & Reference Conditioning
- **Reference Audio Input**: Upload audio files to clone voices with prosody matching
- **Text-Audio Alignment**: Use reference text for better voice characteristic matching
- **Prosody Preservation**: Maintain speaking style and voice characteristics
- **Batch Voice Cloning**: Process multiple voice cloning requests efficiently

### 🌐 User Interfaces
- **Gradio Web Interface**: Intuitive web UI for TTS and voice cloning
- **REST API**: Complete HTTP endpoints for programmatic access
- **WebSocket Support**: Real-time streaming capabilities
- **Multi-speech Interface**: Generate multiple voices simultaneously

### 🔧 Advanced Features
- **Fine-tuning Support**: Training capabilities with Jupyter notebooks
- **Batch Processing**: Multi-speech generation for efficiency
- **Quality Control**: Adjustable synthesis parameters
- **Audio Format Support**: Multiple output formats (WAV, MP3, FLAC)

## 📁 Files Changed

### Core Implementation
- `src/tts/core.js` - Main TTS engine with Flow Matching implementation
- `src/api/routes.js` - REST API endpoints for TTS service
- `src/webui/gradio-app.js` - Gradio web interface
- `src/index.js` - Application entry point and orchestration

### Configuration & Setup
- `package.json` - Updated dependencies and scripts
- `config/models.json` - Model configurations and voice definitions
- `.env.example` - Environment configuration template
- `jest.config.json` - Testing configuration

### Documentation & Examples
- `README.md` - Comprehensive documentation with features and usage
- `notebooks/finetune_demo.ipynb` - Jupyter notebook for fine-tuning
- `tests/tts.test.js` - Unit tests for TTS functionality

## 🚀 Usage Examples

### Basic TTS Synthesis
```javascript
const { TTS } = require('./src/tts/core');

const tts = new TTS({ model: 'v1' });
const result = await tts.synthesize({
  text: 'Hello, this is GenSpark TTS!',
  voice: 'default',
  speed: 1.0
});
```

### Voice Cloning
```javascript
const clonedVoice = await tts.cloneVoice({
  referenceAudio: './reference.wav',
  referenceText: 'This is the reference text',
  targetText: 'Generate this in cloned voice',
  speed: 1.0
});
```

### Web UI Launch
```bash
npm run webui
# Access at http://localhost:7860
```

### API Server
```bash
npm start
# API endpoints available at http://localhost:3000/api
```

## 🎯 API Endpoints

### TTS Endpoints
- `GET /api/health` - Health check
- `GET /api/tts/voices` - List available voices
- `GET /api/tts/models` - List available models
- `POST /api/tts/synthesize` - Generate speech from text
- `POST /api/tts/clone` - Clone voice and synthesize speech
- `POST /api/tts/multi` - Multi-speech generation
- `POST /api/tts/model` - Switch TTS model

## 🧪 Testing

Run the test suite:
```bash
npm test
```

## 📚 Documentation

The README.md has been completely updated with:
- Comprehensive feature overview
- Installation and setup instructions
- Usage examples for all features
- API documentation
- Configuration options
- Development guidelines

## 🔍 Technical Details

### Architecture
- **Flow Matching**: Implements flow-based generative modeling
- **Voice Cloning**: Reference-conditioned generation with prosody matching
- **Multi-model Support**: Switch between different model architectures
- **Scalable Design**: Support for batch processing and real-time synthesis

### Performance
- Configurable inference steps for quality/speed trade-off
- Efficient audio processing with WebSocket streaming
- Memory-efficient model loading and caching
- Optimized for both development and production use

## 🎨 Gradio Interface Features

### Text-to-Speech Tab
- Text input with multi-line support
- Voice selection dropdown
- Model selection (v1/v2)
- Speed control slider
- Steps and CFG scale adjustment
- Audio output with download option

### Multi-Speech Tab
- Batch text input (one per line)
- Voice and model selection
- Batch processing with progress tracking
- Multiple file download

### Voice Cloning Tab
- Reference audio upload
- Reference text input
- Target text for synthesis
- Model and speed configuration
- Real-time cloning output

## 🔄 Model Variants

### V1 Model
- Standard flow matching TTS
- Optimized for general use cases
- Faster inference with good quality
- Suitable for most applications

### V2 Model (IPA)
- IPA-based pronunciation handling
- Enhanced for multilingual support
- Better accent adaptation
- Improved phoneme processing

## 📈 Benefits

1. **High-Quality Synthesis**: Flow matching technology for natural speech
2. **Voice Cloning**: Ability to replicate voices from reference audio
3. **Multi-language Support**: Enhanced with IPA for better pronunciation
4. **Flexible Interface**: Both web UI and API for different use cases
5. **Scalable Architecture**: Support for batch processing and real-time use
6. **Easy Integration**: Simple API and comprehensive documentation
7. **Fine-tuning Ready**: Support for custom model training

## 🔗 Related Work

This implementation is inspired by the excellent [F5-TTS-THAI](https://github.com/VYNCX/F5-TTS-THAI) repository, adapting its concepts for a Node.js environment with additional features and improvements.

## ✅ Checklist

- [x] Core TTS implementation with Flow Matching
- [x] Voice cloning functionality
- [x] Gradio web interface
- [x] REST API with comprehensive endpoints
- [x] Multi-speech generation
- [x] Model switching capability
- [x] Configuration management
- [x] Unit tests
- [x] Documentation and examples
- [x] Fine-tuning notebook

## 📝 Next Steps

Future enhancements could include:
- Real-time streaming synthesis
- Additional language models
- Advanced emotion control
- Integration with cloud storage
- Performance optimizations
- Additional output formats

---

**This PR significantly enhances the GenSpark TTS project with professional-grade features inspired by state-of-the-art research in neural TTS synthesis.** 🚀
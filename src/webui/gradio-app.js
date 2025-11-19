const gr = require('gradio');
const path = require('path');
const { TTS } = require('../tts/core');

/**
 * Gradio Web UI for TTS service
 * Inspired by F5-TTS-THAI interface
 */
class TTSWebUI {
  constructor(options = {}) {
    this.tts = new TTS(options.tts || {});
    this.port = options.port || 7860;
    this.interface = null;
  }
  
  /**
   * Create Gradio interface
   */
  createInterface() {
    const app = gr.Interface(
      this.generateSpeech,
      [
        gr.Textbox(
          label="Text to Synthesize",
          placeholder="Enter text here...",
          lines=3
        ),
        gr.Audio(
          label="Reference Audio (Optional)",
          type="filepath"
        ),
        gr.Textbox(
          label="Reference Text (if using reference audio)",
          placeholder="Enter the text spoken in reference audio...",
          lines=2
        ),
        gr.Dropdown(
          choices=['default', 'male-1', 'female-1', 'thai-1'],
          value='default',
          label="Voice"
        ),
        gr.Dropdown(
          choices=['v1', 'v2'],
          value='v1',
          label="Model"
        ),
        gr.Slider(
          minimum=0.5,
          maximum=2.0,
          value=1.0,
          step=0.1,
          label="Speed"
        ),
        gr.Slider(
          minimum=1,
          maximum=64,
          value=32,
          step=1,
          label="Steps (NFE)"
        ),
        gr.Slider(
          minimum=1.0,
          maximum=3.0,
          value=2.0,
          step=0.1,
          label="CFG Scale"
        )
      ],
      [
        gr.Audio(
          label="Generated Speech",
          type="numpy"
        ),
        gr.Textbox(
          label="Generation Info",
          lines=5
        )
      ],
      title="GenSpark TTS - Flow Matching Text-to-Speech",
      description="Advanced TTS with Voice Cloning inspired by F5-TTS-THAI",
      examples=[
        ["Hello, this is GenSpark TTS speaking!", null, "", "default", "v1", 1.0, 32, 2.0],
        ["สวัสดีครับ นี่คือระบบแปลงข้อความเป็นคำพูด", null, "", "thai-1", "v2", 1.0, 32, 2.0]
      ]
    );
    
    // Multi-speech interface
    const multiSpeechApp = gr.Interface(
      this.generateMultiSpeech,
      [
        gr.Textbox(
          label="Texts (one per line)",
          placeholder="Enter multiple texts, one per line...",
          lines=5
        ),
        gr.Dropdown(
          choices=['default', 'male-1', 'female-1', 'thai-1'],
          value='default',
          label="Voice"
        ),
        gr.Dropdown(
          choices=['v1', 'v2'],
          value='v1',
          label="Model"
        ),
        gr.Slider(
          minimum=0.5,
          maximum=2.0,
          value=1.0,
          step=0.1,
          label="Speed"
        )
      ],
      [
        gr.File(
          label="Generated Audio Files",
          file_count="multiple"
        ),
        gr.Textbox(
          label="Batch Results",
          lines=3
        )
      ],
      title="Multi-Speech Generation",
      description="Generate multiple speech files in batch"
    );
    
    // Voice cloning interface
    const voiceCloneApp = gr.Interface(
      this.cloneVoice,
      [
        gr.Audio(
          label="Reference Audio",
          type="filepath"
        ),
        gr.Textbox(
          label="Reference Text",
          placeholder="Enter the text spoken in reference audio...",
          lines=2
        ),
        gr.Textbox(
          label="Target Text",
          placeholder="Enter text to synthesize in cloned voice...",
          lines=3
        ),
        gr.Dropdown(
          choices=['v1', 'v2'],
          value='v1',
          label="Model"
        ),
        gr.Slider(
          minimum=0.5,
          maximum=2.0,
          value=1.0,
          step=0.1,
          label="Speed"
        )
      ],
      [
        gr.Audio(
          label="Cloned Voice",
          type="numpy"
        ),
        gr.Textbox(
          label="Cloning Info",
          lines=4
        )
      ],
      title="Voice Cloning",
      description="Clone voice from reference audio and synthesize new speech"
    )
    
    // Voice training interface
    const voiceTrainApp = gr.Interface(
      this.trainVoice,
      [
        gr.Textbox(
          label="Dataset Path",
          placeholder="Path to dataset directory containing metadata.csv and audio files...",
          value="/home/user/uploaded_files"
        ),
        gr.Textbox(
          label="Voice Name",
          placeholder="Enter a name for your trained voice...",
          value="my_voice"
        ),
        gr.Slider(
          minimum=10,
          maximum=200,
          value=50,
          step=10,
          label="Training Epochs"
        ),
        gr.Slider(
          minimum=4,
          maximum=32,
          value=8,
          step=4,
          label="Batch Size"
        )
      ],
      [
        gr.Textbox(
          label="Training Progress",
          lines=8
        ),
        gr.Textbox(
          label="Training Results",
          lines=6
        )
      ],
      title="Voice Training",
      description="Train custom voice models using your audio dataset"
    );
    
    // Combine interfaces
    this.interface = gr.TabbedInterface(
      [app, multiSpeechApp, voiceCloneApp, voiceTrainApp],
      ["Text-to-Speech", "Multi-Speech", "Voice Cloning", "Voice Training"]
    );
    
    return this.interface;
  }
  
  /**
   * Generate speech from text
   */
  async generateSpeech(text, referenceAudio, referenceText, voice, model, speed, steps, cfg) {
    try {
      console.log('Generating speech with options:', {
        text: text.substring(0, 50) + '...',
        hasReference: !!referenceAudio,
        voice,
        model,
        speed,
        steps,
        cfg
      });
      
      // Set model if different
      if (model !== this.tts.options.model) {
        await this.tts.setModel(model);
      }
      
      let result;
      
      if (referenceAudio && referenceText) {
        // Voice cloning
        result = await this.tts.cloneVoice({
          referenceAudio,
          referenceText,
          targetText: text,
          speed,
          steps,
          cfg
        });
      } else {
        // Regular synthesis
        result = await this.tts.synthesize({
          text,
          voice,
          speed
        });
      }
      
      const info = `
Model: ${model}
Voice: ${voice}
Speed: ${speed}
Steps: ${steps}
CFG: ${cfg}
Duration: ${result.duration.toFixed(2)}s
Processing Time: ${result.processingTime}ms
      `.trim();
      
      return [result.audio, info];
      
    } catch (error) {
      console.error('Speech generation error:', error);
      throw new Error(`Failed to generate speech: ${error.message}`);
    }
  }
  
  /**
   * Generate multiple speech files
   */
  async generateMultiSpeech(texts, voice, model, speed) {
    try {
      const textList = texts.split('\n').filter(text => text.trim());
      console.log(`Generating ${textList.length} speech files`);
      
      const requests = textList.map((text, index) => ({
        id: `speech_${index}`,
        text: text.trim(),
        voice,
        speed
      }));
      
      const results = await this.tts.multiSpeech(requests);
      
      // Save audio files (simulated)
      const audioFiles = [];
      results.forEach((result, index) => {
        if (result.success) {
          // Simulate file saving
          const filename = `speech_${index}_${Date.now()}.wav`;
          audioFiles.push(filename);
        }
      });
      
      const info = `
Generated ${results.filter(r => r.success).length} of ${results.length} files
Model: ${model}
Voice: ${voice}
Speed: ${speed}
      `.trim();
      
      return [audioFiles, info];
      
    } catch (error) {
      console.error('Multi-speech generation error:', error);
      throw new Error(`Failed to generate multi-speech: ${error.message}`);
    }
  }
  
  /**
   * Clone voice from reference
   */
  async cloneVoice(referenceAudio, referenceText, targetText, model, speed) {
    try {
      if (!referenceAudio || !referenceText || !targetText) {
        throw new Error('Reference audio, reference text, and target text are required');
      }
      
      console.log('Cloning voice from reference audio');
      
      // Set model if different
      if (model !== this.tts.options.model) {
        await this.tts.setModel(model);
      }
      
      const result = await this.tts.cloneVoice({
        referenceAudio,
        referenceText,
        targetText,
        speed
      });
      
      const info = `
Model: ${model}
Speed: ${speed}
Duration: ${result.duration.toFixed(2)}s
Voice Characteristics: ${JSON.stringify(result.voiceCharacteristics, null, 2)}
      `.trim();
      
      return [result.audio, info];
      
    } catch (error) {
      console.error('Voice cloning error:', error);
      throw new Error(`Failed to clone voice: ${error.message}`);
    }
  }
  
  /**
   * Train voice using dataset
   */
  async trainVoice(datasetPath, voiceName, epochs, batchSize) {
    try {
      if (!datasetPath) {
        throw new Error('Dataset path is required');
      }
      
      console.log(`Training voice: ${voiceName}`);
      console.log(`Dataset: ${datasetPath}`);
      console.log(`Epochs: ${epochs}`);
      console.log(`Batch Size: ${batchSize}`);
      
      // Get voice trainer
      const voiceTrainer = this.tts.getVoiceTrainer();
      if (!voiceTrainer) {
        throw new Error('Voice trainer not available');
      }
      
      let progressText = '';
      let resultsText = '';
      
      // Set up event listeners
      voiceTrainer.on('preprocessingProgress', (progress) => {
        progressText = `Preprocessing: ${progress.current}/${progress.total} (${progress.progress.toFixed(1)}%)`;
      });
      
      voiceTrainer.on('trainingProgress', (progress) => {
        progressText = `Training: Epoch ${progress.epoch}/${progress.totalEpochs} - Loss: ${progress.loss.toFixed(6)} - Progress: ${progress.progress.toFixed(1)}%`;
      });
      
      voiceTrainer.on('trainingComplete', (model) => {
        progressText = 'Training completed!';
        resultsText = `
Voice training completed successfully!
Model ID: ${model.id}
Final Loss: ${model.trainingHistory.finalLoss?.toFixed(6)}
Validation Loss: ${model.trainingHistory.validationLoss?.toFixed(6)}
Training Time: ${((model.trainingHistory.endTime - model.trainingHistory.startTime) / 1000).toFixed(1)}s
Training Samples: ${model.metadata.trainingSamples}
Validation Samples: ${model.metadata.validationSamples}
        `.trim();
      });
      
      // Prepare dataset
      progressText = 'Preparing dataset...';
      const datasetInfo = await voiceTrainer.prepareDataset(datasetPath);
      
      // Train voice
      progressText = 'Starting training...';
      const trainedModel = await voiceTrainer.trainVoice({
        voiceName,
        epochs,
        batchSize
      });
      
      return [progressText, resultsText];
      
    } catch (error) {
      console.error('Voice training error:', error);
      throw new Error(`Failed to train voice: ${error.message}`);
    }
  }
  
  /**
   * Launch the web UI
   */
  async launch() {
    try {
      console.log('Initializing TTS system...');
      await new Promise(resolve => {
        this.tts.on('initialized', resolve);
        setTimeout(resolve, 2000); // Timeout fallback
      });
      
      console.log('Creating Gradio interface...');
      const interface = this.createInterface();
      
      console.log(`Launching web UI on port ${this.port}...`);
      interface.launch({
        server_port: this.port,
        server_name: "0.0.0.0",
        share: false,
        quiet: false
      });
      
      console.log(`Web UI available at http://localhost:${this.port}`);
      
    } catch (error) {
      console.error('Failed to launch web UI:', error);
      throw error;
    }
  }
}

// Launch if run directly
if (require.main === module) {
  const webui = new TTSWebUI();
  webui.launch().catch(console.error);
}

module.exports = { TTSWebUI };
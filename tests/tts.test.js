const { TTS } = require('../src/tts/core');

describe('TTS Core', () => {
  let tts;

  beforeEach(() => {
    tts = new TTS({
      model: 'v1',
      steps: 16 // Faster for tests
    });
  });

  afterEach(() => {
    if (tts) {
      tts.removeAllListeners();
    }
  });

  test('should initialize TTS system', async () => {
    const initPromise = new Promise((resolve) => {
      tts.on('initialized', resolve);
    });

    await initPromise;

    expect(tts.initialized).toBe(true);
    expect(tts.models.has('v1')).toBe(true);
  });

  test('should synthesize speech from text', async () => {
    await new Promise(resolve => tts.on('initialized', resolve));

    const result = await tts.synthesize({
      text: 'Hello world',
      voice: 'default'
    });

    expect(result).toHaveProperty('audio');
    expect(result).toHaveProperty('sampleRate');
    expect(result).toHaveProperty('duration');
    expect(result.voice).toBe('default');
  });

  test('should clone voice from reference', async () => {
    await new Promise(resolve => tts.on('initialized', resolve));

    const result = await tts.cloneVoice({
      referenceAudio: './test-audio.wav',
      referenceText: 'This is reference text',
      targetText: 'Hello cloned voice'
    });

    expect(result).toHaveProperty('audio');
    expect(result).toHaveProperty('voiceCharacteristics');
    expect(result.voiceCharacteristics).toHaveProperty('pitch');
  });

  test('should handle multi-speech generation', async () => {
    await new Promise(resolve => tts.on('initialized', resolve));

    const requests = [
      { id: '1', text: 'First speech' },
      { id: '2', text: 'Second speech' }
    ];

    const results = await tts.multiSpeech(requests);

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(2);
    expect(results[0]).toHaveProperty('id');
    expect(results[0]).toHaveProperty('success');
  });

  test('should get available voices', () => {
    const voices = tts.getVoices();

    expect(Array.isArray(voices)).toBe(true);
    expect(voices.length).toBeGreaterThan(0);
    expect(voices[0]).toHaveProperty('id');
    expect(voices[0]).toHaveProperty('name');
  });

  test('should handle errors gracefully', async () => {
    await new Promise(resolve => tts.on('initialized', resolve));

    await expect(tts.synthesize({})).rejects.toThrow('Text is required');
  });
});
class AudioProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const mono = input[0];
      if (mono && mono.length > 0) {
        this.port.postMessage(mono);
      }
    }
    return true; // Keep processor alive
  }
}

registerProcessor("audio-processor", AudioProcessor);
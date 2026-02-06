// Simple notification sounds using Web Audio API
// No external files needed - generates sounds programmatically

type SoundType = 'order' | 'message' | 'warning' | 'success';

let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
};

const playTone = (
  frequency: number, 
  duration: number, 
  type: OscillatorType = 'sine',
  volume: number = 0.3
) => {
  try {
    const ctx = getAudioContext();
    
    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    // Fade in and out for smoother sound
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (error) {
    console.log('Audio playback not available:', error);
  }
};

export const playNotificationSound = (type: SoundType = 'message') => {
  switch (type) {
    case 'order':
      // Happy two-tone chime for new orders
      playTone(523.25, 0.15, 'sine', 0.25); // C5
      setTimeout(() => playTone(659.25, 0.2, 'sine', 0.25), 100); // E5
      setTimeout(() => playTone(783.99, 0.25, 'sine', 0.25), 200); // G5
      break;
      
    case 'message':
      // Soft notification pop
      playTone(800, 0.1, 'sine', 0.2);
      setTimeout(() => playTone(1000, 0.15, 'sine', 0.15), 80);
      break;
      
    case 'warning':
      // Alert tone for low stock
      playTone(440, 0.15, 'triangle', 0.3); // A4
      setTimeout(() => playTone(349.23, 0.2, 'triangle', 0.3), 150); // F4
      break;
      
    case 'success':
      // Success chime
      playTone(440, 0.1, 'sine', 0.2);
      setTimeout(() => playTone(554.37, 0.1, 'sine', 0.2), 100);
      setTimeout(() => playTone(659.25, 0.15, 'sine', 0.2), 200);
      break;
      
    default:
      playTone(600, 0.15, 'sine', 0.2);
  }
};

// Initialize audio context on first user interaction
export const initAudioContext = () => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
};

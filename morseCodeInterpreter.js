const MorseCodeModule = (function () {
  const morseCodeMap = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.',
    'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---',
    'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---',
    'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-',
    'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--',
    'Z': '--..',
    '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....',
    '6': '-....', '7': '--...', '8': '---..', '9': '----.'
  };

  const morseCodeEncoder = text => {
    return text
      .replace(/[a-zA-Z0-9 ]/g, char => char === ' ' ? '/' : morseCodeMap[char.toUpperCase()] + ' ');
  };

  const morseCodeSoundFactory = (code, record = false) => {
    const codeArray = code.split('');
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const now = audioContext.currentTime;
    const dotDuration = 0.15;
    let totalTime = 0;

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, 0);
    gainNode.gain.setValueAtTime(0, now);

    codeArray.forEach(code => {
      switch (code) {
        case ".":
          gainNode.gain.setValueAtTime(1, totalTime);
          totalTime += dotDuration;
          gainNode.gain.setValueAtTime(0, totalTime);
          totalTime += dotDuration;
          break;
        case "-":
          gainNode.gain.setValueAtTime(1, totalTime);
          totalTime += 3 * dotDuration;
          gainNode.gain.setValueAtTime(0, totalTime);
          totalTime += dotDuration;
          break;
        case "/":
          totalTime += 6 * dotDuration;
          break;
      }
    });

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();

    if (record) {
      const mediaStreamDestination = audioContext.createMediaStreamDestination();

      gainNode.connect(mediaStreamDestination);

      const mediaRecorder = new MediaRecorder(mediaStreamDestination.stream);
      const audioChunks = [];

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'morse_code.wav';
        a.click();
      };

      mediaRecorder.start();

      setTimeout(() => {
        mediaRecorder.stop();
        oscillator.stop(now + totalTime + dotDuration);
      }, totalTime * 1000);
    } else {

      oscillator.stop(now + totalTime + dotDuration);
    }
  };

  return {
    encode: morseCodeEncoder,
    play: morseCodeSoundFactory,
  };
})();

// Usage
const morseCodeToBeSent = MorseCodeModule.encode("Hello World");
MorseCodeModule.play(morseCodeToBeSent, true);

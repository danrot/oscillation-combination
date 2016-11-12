export default function WebAudioDriver(instructions$) {
    const audioContext = new AudioContext();
    let oscillators = [];
    let gains = [];

    instructions$.addListener({
        next: (instructions) => {
            console.log(instructions);
            for (let i = 0; i < instructions.length; ++i) {
                const newOscillator = !oscillators[i];
                if (newOscillator) {
                    oscillators[i] = audioContext.createOscillator();
                    gains[i] = audioContext.createGain();
                }

                gains[i].gain.value = instructions[i].volume;
                oscillators[i].frequency.value = instructions[i].frequency;

                if (newOscillator) {
                    oscillators[i].connect(gains[i]);
                    gains[i].connect(audioContext.destination);
                    oscillators[i].start();
                }
            }

            oscillators.filter((oscillator, index) => index >= instructions.length).map((oscillator) => oscillator.stop);

            oscillators = oscillators.filter((oscillator, index) => index < instructions.length)
        }
    });
}

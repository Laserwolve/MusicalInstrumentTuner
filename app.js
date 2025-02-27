navigator.mediaDevices.enumerateDevices()
.then(function(devices) {
    var audioInputDevices = devices.filter(function(device) {
        return device.kind === 'audioinput';
    });
    // if (audioInputDevices.length > 0) {
    //     document.getElementById('microphone-name').innerText = audioInputDevices[0].label;
    // }

    return navigator.mediaDevices.getUserMedia({ audio: true });
})
.then(function(stream) {
    var audioContext = new (window.AudioContext || window.webkitAudioContext)();
    var analyser = audioContext.createAnalyser();
    var microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);
    analyser.fftSize = 2048;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);

    var lastUpdateTime = 0;

    var noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

    var getNote = function(frequency) {
        var noteNumber = 12 * (Math.log(frequency / 440) / Math.log(2));
        return Math.round(noteNumber) + 69;
    };

    var getNoteName = function(note) {
        var octave = Math.floor(note / 12) - 1;
        var noteName = noteStrings[note % 12];
        return noteName + octave;
    };

    var getCentsOffFromPitch = function(frequency, note) {
        return Math.floor(1200 * Math.log(frequency / (440 * Math.pow(2, (note - 69) / 12))) / Math.log(2));
    };

    var canvas = document.getElementById('frequency-canvas');
    var canvasContext = canvas.getContext('2d');

    var updateFrequency = function() {
        analyser.getByteTimeDomainData(dataArray);

        var maxIndex = 0;
        var maxValue = -Infinity;
        for (var i = 0; i < bufferLength; i++) {
            if (dataArray[i] > maxValue) {
                maxValue = dataArray[i];
                maxIndex = i;
            }
        }

        var nyquist = audioContext.sampleRate / 2;
        var frequency = maxIndex * nyquist / bufferLength;

        var currentTime = audioContext.currentTime;
        if (currentTime - lastUpdateTime >= 1) {
            canvasContext.clearRect(0, 0, canvas.width, canvas.height);
            canvasContext.fillStyle = 'black';
            canvasContext.fillRect(0, 45, canvas.width, 10);

            if (frequency > 0) {
                var note = getNote(frequency);
                var noteName = getNoteName(note);
                var cents = getCentsOffFromPitch(frequency, note);
                document.getElementById('frequency').innerText = noteName;

                // Draw the visual representation
                canvasContext.fillStyle = 'red';
                canvasContext.fillRect(150 + cents, 40, 2, 20);
            } else {
                document.getElementById('frequency').innerText = "-";
            }
            lastUpdateTime = currentTime;
        }

        requestAnimationFrame(updateFrequency);
    };

    updateFrequency();
})
.catch(function(err) {
    console.error('Error accessing microphone: ', err);
});

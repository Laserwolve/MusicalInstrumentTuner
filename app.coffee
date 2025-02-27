navigator.mediaDevices.enumerateDevices().then((devices) ->
  audioInputDevices = devices.filter((device) ->
    device.kind == 'audioinput'
  )
  # if (audioInputDevices.length > 0) {
  #     document.getElementById('microphone-name').innerText = audioInputDevices[0].label;
  # }
  navigator.mediaDevices.getUserMedia audio: true
).then((stream) ->
  audioContext = new ((window.AudioContext or window.webkitAudioContext))
  analyser = audioContext.createAnalyser()
  microphone = audioContext.createMediaStreamSource(stream)
  microphone.connect analyser
  analyser.fftSize = 2048
  bufferLength = analyser.frequencyBinCount
  dataArray = new Uint8Array(bufferLength)
  lastUpdateTime = 0
  noteStrings = [
    'C'
    'C#'
    'D'
    'D#'
    'E'
    'F'
    'F#'
    'G'
    'G#'
    'A'
    'A#'
    'B'
  ]

  getNote = (frequency) ->
    noteNumber = 12 * Math.log(frequency / 440) / Math.log(2)
    Math.round(noteNumber) + 69

  getNoteName = (note) ->
    octave = Math.floor(note / 12) - 1
    noteName = noteStrings[note % 12]
    noteName + octave

  getCentsOffFromPitch = (frequency, note) ->
    Math.floor 1200 * Math.log(frequency / (440 * 2 ** ((note - 69) / 12))) / Math.log(2)

  canvas = document.getElementById('frequency-canvas')
  canvasContext = canvas.getContext('2d')

  updateFrequency = ->
    analyser.getByteTimeDomainData dataArray
    maxIndex = 0
    maxValue = -Infinity
    i = 0
    while i < bufferLength
      if dataArray[i] > maxValue
        maxValue = dataArray[i]
        maxIndex = i
      i++
    nyquist = audioContext.sampleRate / 2
    frequency = maxIndex * nyquist / bufferLength
    currentTime = audioContext.currentTime
    if currentTime - lastUpdateTime >= 1
      canvasContext.clearRect 0, 0, canvas.width, canvas.height
      canvasContext.fillStyle = 'black'
      canvasContext.fillRect 0, 45, canvas.width, 10
      if frequency > 0
        note = getNote(frequency)
        noteName = getNoteName(note)
        cents = getCentsOffFromPitch(frequency, note)
        document.getElementById('frequency').innerText = noteName
        # Draw the visual representation
        canvasContext.fillStyle = 'red'
        canvasContext.fillRect 150 + cents, 40, 2, 20
      else
        document.getElementById('frequency').innerText = '-'
      lastUpdateTime = currentTime
    requestAnimationFrame updateFrequency
    return

  updateFrequency()
  return
).catch (err) ->
  console.error 'Error accessing microphone: ', err
  return

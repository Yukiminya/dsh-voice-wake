window.__ModuleLoader__.load({
  id: '@local/voice-wake',
  factory(require) {
    'use strict'

    const React = require('react')
    const h = React.createElement

    const NS = 'voice-wake'
    const STORAGE_KEY = 'dsh.voice-wake.enabled'
    const REPLY_KEY = 'dsh.voice-wake.reply'
    const REPLY_VOICE_KEY = 'dsh.voice-wake.reply-voice'
    const WAKE_WORDS = ['大肥鱼来', '大飞鱼来', '大肥魚來', '大肥鱼', '大飞鱼', '大肥魚', '大肥鱼莱', '大飞鱼莱']
    const IDLE_SHOW_MS = 4000

    const LOCALES = {
      zh: {
        title: '免提唤醒',
        switchLabel: '常开麦克风：说「大肥鱼来」后停顿两秒自动发送',
        offHint: '打开开关后说「大肥鱼来」，停顿两秒自动执行',
        starting: '正在打开麦克风…',
        idle: '聆听中 · 说「大肥鱼来」',
        armed: '我在听，请说指令',
        capturing: '正在听，说完停顿两秒自动发送',
        ending: '停顿中，马上处理…',
        transcribing: '识别中…',
        sending: '正在发送…',
        sent: '已发送：{text}',
        heard: '请先说「大肥鱼来」（刚听到「{text}」）',
        error: '出错了：{message}',
        micDenied: '麦克风权限被拒绝，请在系统设置中允许',
        micMissing: '没有找到可用的麦克风',
        micLost: '麦克风连接中断',
        micBusy: '麦克风被其他程序占用',
        retryMic: '重试麦克风',
        noSession: '当前没有可发送的会话',
        deps: '未启用「语音输入」插件，无法识别语音',
        notReady: '语音模型还没准备好',
        prepare: '下载语音模型',
        retry: '重试',
        downloading: '正在下载语音模型 {completed} / {total} MB',
        checking: '正在检查语音模型…',
        loading: '正在加载语音模型…',
        waking: '正在唤醒语音模型…',
        failed: '语音模型准备失败：{message}',
        download: {
          timeout: '模型下载超时，请检查网络后重试',
          network: '网络不可用，请检查网络后重试',
          dns: '域名解析失败，请检查网络后重试',
          certificate: '下载源证书校验失败，请稍后重试',
          http: '下载源返回错误，请稍后重试',
          integrity: '模型文件校验失败，请重试',
          storage: '磁盘写入失败，请检查剩余空间',
          unknown: '模型下载失败，请重试',
        },
        activate: '点击输入框或页面任意处激活麦克风',
        replyToggle: '唤醒应答：听到「大肥鱼来」后回一声「来了」',
        replyPreview: '试听应答',
        replyVoiceLabel: '应答音色',
        replyVoiceA: '音色 1',
        replyVoiceB: '音色 2',
      },
      en: {
        title: 'Hands-free wake',
        switchLabel: 'Keep the microphone on: say “大肥鱼来” and pause two seconds to send',
        offHint: 'Turn on, say “大肥鱼来”, then one sentence; it runs after two seconds',
        starting: 'Opening the microphone…',
        idle: 'Listening · say “大肥鱼来”',
        armed: 'Listening for your command',
        capturing: 'Listening; it sends two seconds after you stop',
        ending: 'Pausing, sending shortly…',
        transcribing: 'Transcribing…',
        sending: 'Sending…',
        sent: 'Sent: {text}',
        heard: 'Say “大肥鱼来” first (heard “{text}”)',
        error: 'Something went wrong: {message}',
        micDenied: 'Microphone permission was denied; allow it in system settings',
        micMissing: 'No microphone was found',
        micLost: 'The microphone was disconnected',
        micBusy: 'The microphone is in use by another application',
        retryMic: 'Retry microphone',
        noSession: 'There is no session to send to',
        deps: 'The “Voice input” plugin is not enabled, so speech cannot be recognized',
        notReady: 'The speech model is not ready yet',
        prepare: 'Download speech model',
        retry: 'Retry',
        downloading: 'Downloading speech model {completed} / {total} MB',
        checking: 'Checking the speech model…',
        loading: 'Loading the speech model…',
        waking: 'Waking the speech model…',
        failed: 'Speech model preparation failed: {message}',
        download: {
          timeout: 'The model download timed out; check your network and retry',
          network: 'The network is unavailable; check it and retry',
          dns: 'Domain resolution failed; check your network and retry',
          certificate: 'The download source failed certificate checks; retry later',
          http: 'The download source returned an error; retry later',
          integrity: 'The model file failed verification; retry',
          storage: 'Writing to disk failed; check free space',
          unknown: 'The model download failed; retry',
        },
        activate: 'Click the composer or anywhere on the page to activate the microphone',
        replyToggle: 'Wake reply: say “来的” back after “大肥鱼来” is heard',
        replyPreview: 'Preview reply',
        replyVoiceLabel: 'Reply voice',
        replyVoiceA: 'Voice 1',
        replyVoiceB: 'Voice 2',
      },
    }

    // ----------------------------------------------------------------------
    // Utilities
    // ----------------------------------------------------------------------

    function createStore(initial) {
      let state = initial
      const listeners = new Set()
      return {
        getSnapshot() { return state },
        subscribe(listener) {
          listeners.add(listener)
          return () => { listeners.delete(listener) }
        },
        set(patch) {
          let changed = false
          for (const key of Object.keys(patch)) {
            if (state[key] !== patch[key]) { changed = true; break }
          }
          if (!changed) return
          state = { ...state, ...patch }
          for (const listener of [...listeners]) {
            try { listener() } catch (error) { console.error('[voice-wake] listener failed', error) }
          }
        },
      }
    }

    function messageOf(error) {
      if (error && typeof error === 'object' && typeof error.message === 'string' && error.message !== '') return error.message
      return String(error)
    }

    const PUNCTUATION = /[\u3000,，。.!！?？、;；:：'"“”‘’「」『』()（）\-—_~·]/g

    function spacedText(text) {
      return String(text || '').replace(PUNCTUATION, ' ').replace(/\s+/g, ' ').trim()
    }

    function compactText(text) {
      return text.replace(/\s+/g, '')
    }

    function spacedIndexAt(spaced, compactIndex) {
      let count = 0
      for (let i = 0; i < spaced.length; i++) {
        if (spaced[i] === ' ') continue
        if (count === compactIndex) return i
        count++
      }
      return spaced.length
    }

    /** Find the earliest wake word and return the command that follows it. */
    function findWakeWord(text) {
      const spaced = spacedText(text)
      const compact = compactText(spaced)
      let best = null
      for (const word of WAKE_WORDS) {
        const index = compact.indexOf(word)
        if (index < 0) continue
        if (best === null || index < best.index || (index === best.index && word.length > best.word.length)) {
          best = { index, word }
        }
      }
      if (best === null) return null
      const boundary = spacedIndexAt(spaced, best.index + best.word.length)
      return { remainder: spaced.slice(boundary).trim() }
    }

    /** Encode 16 kHz mono samples as a canonical PCM16 WAV. */
    function encodeWave(samples) {
      const bytes = new Uint8Array(44 + samples.length * 2)
      const view = new DataView(bytes.buffer)
      const text = (at, value) => { for (let i = 0; i < value.length; i++) bytes[at + i] = value.charCodeAt(i) }
      text(0, 'RIFF'); view.setUint32(4, bytes.length - 8, true); text(8, 'WAVE'); text(12, 'fmt ')
      view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true)
      view.setUint32(24, 16000, true); view.setUint32(28, 32000, true)
      view.setUint16(32, 2, true); view.setUint16(34, 16, true); text(36, 'data')
      view.setUint32(40, samples.length * 2, true)
      for (let i = 0; i < samples.length; i++) {
        const value = Math.max(-1, Math.min(1, samples[i]))
        view.setInt16(44 + i * 2, Math.round(value * (value < 0 ? 32768 : 32767)), true)
      }
      return bytes
    }

    function resample(input, from, to) {
      if (from === to) return input
      const ratio = from / to
      const length = Math.max(1, Math.floor(input.length / ratio))
      const output = new Float32Array(length)
      for (let i = 0; i < length; i++) {
        const position = i * ratio
        const low = Math.floor(position)
        const fraction = position - low
        const a = input[low] || 0
        const b = input[Math.min(input.length - 1, low + 1)] || a
        output[i] = a + (b - a) * fraction
      }
      return output
    }

    function audioBase64(bytes) {
      let text = ''
      for (let i = 0; i < bytes.length; i += 8192) text += String.fromCharCode(...bytes.subarray(i, i + 8192))
      return btoa(text)
    }

    // ----------------------------------------------------------------------
    // Voice activity detection: frames in, complete utterances out
    // ----------------------------------------------------------------------

    function createVad(options) {
      const { sampleRate, endSilenceMs, maxUtteranceMs, onStart, onSilence, onResume, onEnd } = options
      const frameMsOf = (frame) => (frame.length / sampleRate) * 1000
      const endSilenceFor = () => (typeof endSilenceMs === 'function' ? endSilenceMs() : endSilenceMs)
      let activeEndSilence = endSilenceFor()
      let noise = 0.003
      let threshold = 0.008
      let loudMs = 0
      let inSpeech = false
      let silenceMs = 0
      let silenceNotified = false
      let utteranceMs = 0
      let utterance = []
      let preRoll = []
      let preRollMs = 0

      const finish = () => {
        const samples = new Float32Array(utterance.reduce((total, frame) => total + frame.length, 0))
        let offset = 0
        for (const frame of utterance) { samples.set(frame, offset); offset += frame.length }
        utterance = []
        preRoll = []
        preRollMs = 0
        inSpeech = false
        silenceMs = 0
        silenceNotified = false
        utteranceMs = 0
        loudMs = 0
        try { onEnd(samples) } catch (error) { console.error('[voice-wake] utterance handler failed', error) }
      }

      const reset = () => {
        utterance = []
        preRoll = []
        preRollMs = 0
        inSpeech = false
        silenceMs = 0
        silenceNotified = false
        utteranceMs = 0
        loudMs = 0
      }

      const push = (frame) => {
        if (!frame || frame.length === 0) return
        const ms = frameMsOf(frame)
        let sum = 0
        for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i]
        const rms = Math.sqrt(sum / frame.length)

        if (!inSpeech) {
          if (rms < noise) noise = noise * 0.9 + rms * 0.1
          else noise = noise * 0.999 + rms * 0.001
          threshold = Math.min(0.08, Math.max(0.006, noise * 3.2))
          preRoll.push(frame)
          preRollMs += ms
          while (preRoll.length > 1 && preRollMs - frameMsOf(preRoll[0]) >= 320) {
            preRollMs -= frameMsOf(preRoll[0])
            preRoll.shift()
          }
          if (rms > threshold) loudMs += ms
          else loudMs = Math.max(0, loudMs - ms * 2)
          if (loudMs >= 128) {
            inSpeech = true
            activeEndSilence = endSilenceFor()
            utterance = preRoll.slice()
            utteranceMs = preRollMs
            preRoll = []
            preRollMs = 0
            silenceMs = 0
            try { onStart() } catch (error) { console.error('[voice-wake] speech-start handler failed', error) }
          }
          return
        }

        utterance.push(frame)
        utteranceMs += ms
        if (rms > threshold) {
          silenceMs = 0
          if (silenceNotified) {
            silenceNotified = false
            try { onResume() } catch (error) { console.error('[voice-wake] speech-resume handler failed', error) }
          }
        } else {
          silenceMs += ms
          if (!silenceNotified && silenceMs >= 400) {
            silenceNotified = true
            try { onSilence() } catch (error) { console.error('[voice-wake] speech-silence handler failed', error) }
          }
        }
        if (silenceMs >= activeEndSilence || utteranceMs >= maxUtteranceMs) finish()
      }

      return { push, reset }
    }

    // ----------------------------------------------------------------------
    // Microphone tap
    // ----------------------------------------------------------------------

    const TAP_SOURCE = [
      'class VoiceWakeTap extends AudioWorkletProcessor {',
      '  constructor() { super(); this.buffer = new Float32Array(1024); this.length = 0 }',
      '  process(inputs) {',
      '    const channel = inputs[0] && inputs[0][0]',
      '    if (channel) {',
      '      for (let i = 0; i < channel.length; i++) {',
      '        this.buffer[this.length++] = channel[i]',
      '        if (this.length === this.buffer.length) {',
      '          this.port.postMessage(this.buffer)',
      '          this.buffer = new Float32Array(1024)',
      '          this.length = 0',
      '        }',
      '      }',
      '    }',
      '    return true',
      '  }',
      '}',
      'registerProcessor("voice-wake-tap", VoiceWakeTap)',
    ].join('\n')

    async function createWorkletTap(audio, onFrames) {
      if (!audio.audioWorklet) throw new Error('AudioWorklet is unavailable')
      const url = URL.createObjectURL(new Blob([TAP_SOURCE], { type: 'text/javascript' }))
      try { await audio.audioWorklet.addModule(url) } finally { URL.revokeObjectURL(url) }
      const node = new AudioWorkletNode(audio, 'voice-wake-tap', { channelCount: 1, channelCountMode: 'explicit' })
      node.port.onmessage = (event) => onFrames(new Float32Array(event.data))
      return node
    }

    function createScriptTap(audio, onFrames) {
      const node = audio.createScriptProcessor(1024, 1, 1)
      node.onaudioprocess = (event) => onFrames(new Float32Array(event.inputBuffer.getChannelData(0)))
      return node
    }

    function stopTracks(stream) {
      try { for (const track of stream.getTracks()) track.stop() } catch (error) { /* already gone */ }
    }

    // ----------------------------------------------------------------------
    // Controller: one microphone and one state machine per page
    // ----------------------------------------------------------------------

    function createController(ctx) {
      const store = createStore({
        enabled: false,
        phase: 'off',
        code: 'off',
        detail: '',
        message: '',
        mic: '',
        providerPhase: '',
        providerMessage: '',
        failureReason: '',
        usable: false,
        progress: null,
        connected: false,
        deps: false,
        dockVisible: false,
        replyEnabled: true,
        replyVoice: 'a',
        replyPlaying: false,
      })

      let speech = null
      let catalog = null
      let readiness = null
      let readinessWork = null
      let targetSessionId = ''
      const holders = new Map()
      let enabled = false
      let armed = false
      let capture = null
      let capturePromise = null
      let micGeneration = 0
      let busy = false
      let armedTimer = null
      let noticeTimer = null
      let abort = new AbortController()
      let depsTimer = null
      let gestureCleanup = null
      let replyEnabled = true
      let replyVoice = 'a'
      let replyPlaying = false
      let replyAudio = null
      let replyTimer = null

      function publish(patch) { store.set(patch) }

      function clearNotice() {
        if (noticeTimer !== null) { clearTimeout(noticeTimer); noticeTimer = null }
      }

      function showNotice(code, detail, duration) {
        clearNotice()
        publish({ code, detail: detail || '', phase: 'idle' })
        noticeTimer = setTimeout(() => {
          noticeTimer = null
          if (enabled && !busy && ['heard', 'sent'].includes(store.getSnapshot().code)) publish({ code: 'idle', detail: '' })
        }, duration || IDLE_SHOW_MS)
      }

      function clearArmed() {
        armed = false
        if (armedTimer !== null) { clearTimeout(armedTimer); armedTimer = null }
      }

      function arm() {
        clearArmed()
        armed = true
        publish({ code: 'armed', detail: '', phase: 'idle' })
        armedTimer = setTimeout(() => {
          armedTimer = null
          if (armed && !busy && store.getSnapshot().code === 'armed') {
            armed = false
            publish({ code: 'idle', detail: '' })
          }
        }, 15000)
      }

      function fail(code, message) {
        clearArmed()
        publish({ code, message: message || '', phase: 'idle', enabled })
      }

      // ---- speech remote readiness ----

      function applyCatalog(value) {
        catalog = value
        const provider = value.providers.find((item) => item.id === value.selection.providerId)
        const preparation = provider && provider.preparation ? provider.preparation : { phase: 'ready' }
        const phase = preparation.phase
        const usable = ['ready', 'standby', 'waking'].includes(phase)
        const progress = phase === 'downloading'
          ? { completed: preparation.completedBytes || 0, total: preparation.totalBytes || 0 }
          : null
        const providerMessage = phase === 'failed' ? (preparation.message || '') : ''
        const failure = phase === 'failed' && preparation.download ? preparation.download : null
        publish({
          connected: true,
          providerPhase: phase,
          providerMessage,
          failureReason: failure ? failure.reason : '',
          usable,
          progress,
          deps: false,
          providerName: provider ? provider.name : '',
        })
        if (!enabled) return
        if (usable && capture === null && capturePromise === null) void startCapture()
        if (!usable && capture !== null) void stopCapture()
      }

      function applyReadinessError(error) {
        publish({ connected: false })
        console.warn('[voice-wake] speech readiness failed', messageOf(error))
      }

      function connectSpeech(remote) {
        const namespaced = remote && remote.speech
        if (!namespaced || speech === namespaced) return
        speech = namespaced
        publish({ deps: false })
        try {
          readiness = remote.$stream({
            name: 'voice-wake speech readiness',
            open: (signal) => namespaced.follow(signal),
            ended: () => new Error('speech readiness stream ended'),
            carrierFailed: (error) => applyReadinessError(error),
          })
          readinessWork = (async () => {
            try {
              for await (const item of readiness) {
                item.accept()
                applyCatalog(item.value)
              }
            } catch (error) {
              if (enabled) applyReadinessError(error)
            }
          })()
        } catch (error) {
          applyReadinessError(error)
        }
      }

      async function disconnectSpeech() {
        speech = null
        catalog = null
        await stopCapture()
        if (readiness) { try { await readiness.dispose() } catch (error) { /* carrier already gone */ } }
        readiness = null
        readinessWork = null
        publish({ connected: false, usable: false, providerPhase: '', progress: null })
      }

      // ---- microphone ----

      async function startCapture() {
        if (capture !== null || capturePromise !== null) return
        const generation = ++micGeneration
        publish({ phase: 'starting', code: 'starting', message: '' })
        capturePromise = (async () => {
          let stream = null
          try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('getUserMedia unavailable')
            stream = await navigator.mediaDevices.getUserMedia({
              audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
              video: false,
            })
            if (generation !== micGeneration || !enabled) { stopTracks(stream); return }
            const audio = new AudioContext({ sampleRate: 16000 })
            const rate = audio.sampleRate || 16000
            await audio.resume().catch(() => {})
            const source = audio.createMediaStreamSource(stream)
            const sink = audio.createGain()
            sink.gain.value = 0
            sink.connect(audio.destination)
            const vad = createVad({
              sampleRate: rate,
              endSilenceMs: () => (armed ? 2000 : 900),
              maxUtteranceMs: 30000,
              onStart: () => {
                if (!busy && store.getSnapshot().code !== 'capturing') publish({ code: 'capturing', detail: '' })
              },
              onSilence: () => {
                if (!busy && store.getSnapshot().code === 'capturing') publish({ code: 'ending' })
              },
              onResume: () => {
                if (!busy && store.getSnapshot().code === 'ending') publish({ code: 'capturing' })
              },
              onEnd: (samples) => { void handleUtterance(samples, rate) },
            })
            const pushFrame = (frame) => {
              if (replyPlaying) { vad.reset(); return }
              vad.push(frame)
            }
            let node = null
            try { node = await createWorkletTap(audio, pushFrame) }
            catch (error) { node = createScriptTap(audio, pushFrame) }
            if (generation !== micGeneration) {
              try { node.disconnect() } catch (error) { /* detached */ }
              try { await audio.close() } catch (error) { /* closed */ }
              stopTracks(stream)
              return
            }
            source.connect(node)
            node.connect(sink)
            capture = { stream, audio, source, node, sink, generation }
            const label = stream.getAudioTracks().map((track) => track.label).find((name) => !!name) || ''
            for (const track of stream.getAudioTracks()) {
              track.addEventListener('ended', () => {
                if (capture !== null && capture.stream === stream) {
                  void stopCapture()
                  if (enabled) fail('micLost', '')
                }
              })
            }
            publish({ phase: 'idle', code: 'idle', detail: '', mic: label, message: '' })
            if (audio.state !== 'running') {
              publish({ code: 'activate', phase: 'idle' })
              const resume = () => {
                void audio.resume().then(() => {
                  if (capture !== null && capture.audio === audio && store.getSnapshot().code === 'activate') {
                    publish({ code: 'idle', phase: 'idle' })
                  }
                }).catch(() => {})
              }
              window.addEventListener('pointerdown', resume, { capture: true, once: true })
              gestureCleanup = () => window.removeEventListener('pointerdown', resume, { capture: true })
            }
          } catch (error) {
            if (stream) stopTracks(stream)
            if (generation !== micGeneration) return
            enabled = false
            try { localStorage.setItem(STORAGE_KEY, '0') } catch (e) { /* storage unavailable */ }
            const name = error && error.name ? error.name : ''
            if (name === 'NotAllowedError' || name === 'SecurityError') fail('micDenied', '')
            else if (name === 'NotFoundError' || name === 'OverconstrainedError') fail('micMissing', '')
            else if (name === 'NotReadableError' || name === 'AbortError') fail('micBusy', '')
            else fail('error', messageOf(error))
            publish({ enabled: false, phase: 'off' })
          } finally {
            if (generation === micGeneration) capturePromise = null
          }
        })()
        await capturePromise
      }

      async function stopCapture() {
        micGeneration++
        const active = capture
        capture = null
        capturePromise = null
        if (gestureCleanup) { gestureCleanup(); gestureCleanup = null }
        if (active === null) return
        try { active.node.port && active.node.port.close && active.node.port.close() } catch (error) { /* closed */ }
        try { active.node.onaudioprocess = null } catch (error) { /* script tap */ }
        try { active.node.disconnect() } catch (error) { /* detached */ }
        try { active.source.disconnect() } catch (error) { /* detached */ }
        try { active.sink.disconnect() } catch (error) { /* detached */ }
        stopTracks(active.stream)
        try { await active.audio.close() } catch (error) { /* already closed */ }
      }

      // ---- recognition and delivery ----

      async function transcribe(samples, rate) {
        if (speech === null) throw new Error('speech unavailable')
        const pcm = resample(samples, rate, 16000)
        const wave = encodeWave(pcm)
        const selection = catalog ? catalog.selection : { providerId: undefined, language: 'auto' }
        const result = await speech.transcribe({
          audioBase64: audioBase64(wave),
          providerId: selection.providerId,
          language: selection.language,
        }, abort.signal)
        if (!result || result.ok !== true) {
          const reason = result && result.error && result.error.message ? result.error.message : 'transcription failed'
          throw new Error(reason)
        }
        return String((result.value && result.value.text) || '')
      }

      async function submitPrompt(text) {
        const sessionId = targetSessionId
        if (!sessionId) throw new Error('noSession')
        const reference = ctx.sessions.retain(sessionId, { source: 'gateway' })
        try {
          await reference.ready
          const result = await reference.binding.session.prompt([{ type: 'text', text }], 'queue')
          if (!result || result.ok !== true) {
            const reason = result && result.error && result.error.message ? result.error.message : 'prompt rejected'
            throw new Error(reason)
          }
        } finally {
          reference.release()
        }
      }

      async function send(text) {
        clearArmed()
        clearNotice()
        publish({ code: 'sending', phase: 'busy', detail: text })
        try {
          await submitPrompt(text)
          showNotice('sent', text)
        } catch (error) {
          const reason = messageOf(error)
          if (reason === 'noSession') fail('noSession', '')
          else fail('error', reason)
        }
      }

      async function routeText(text, wasArmed) {
        if (text === '') {
          if (wasArmed) arm()
          else publish({ code: 'idle', phase: 'idle', detail: '' })
          return
        }
        if (wasArmed) {
          const wake = findWakeWord(text)
          const command = wake ? wake.remainder : text
          if (command.length < 2) { arm(); return }
          await send(command)
          return
        }
        const wake = findWakeWord(text)
        if (wake === null) {
          showNotice('heard', text)
          return
        }
        playWakeReply()
        if (wake.remainder.length < 2) { arm(); return }
        await send(wake.remainder)
      }

      async function handleUtterance(samples, rate) {
        if (!enabled || busy || speech === null) return
        if (samples.length / rate < 0.15) return
        const wasArmed = armed
        busy = true
        clearArmed()
        publish({ phase: 'busy', code: 'transcribing', detail: '' })
        try {
          const transcript = await transcribe(samples, rate)
          await routeText(spacedText(transcript), wasArmed)
        } catch (error) {
          if (enabled) fail('error', messageOf(error))
        } finally {
          busy = false
        }
      }

      // ---- public API ----

      function setTarget(sessionId) {
        if (!sessionId) return
        holders.set(sessionId, (holders.get(sessionId) || 0) + 1)
        targetSessionId = sessionId
      }

      function clearTarget(sessionId) {
        const count = (holders.get(sessionId) || 1) - 1
        if (count <= 0) holders.delete(sessionId)
        else holders.set(sessionId, count)
        if (targetSessionId === sessionId && !holders.has(sessionId)) {
          const remaining = [...holders.keys()]
          targetSessionId = remaining.length > 0 ? remaining[remaining.length - 1] : ''
        }
      }

      // ---- wake reply ----

      function replyClip() {
        return replyVoice === 'b' ? WAKE_REPLIES[1] : WAKE_REPLIES[0]
      }

      function stopReply() {
        if (replyTimer !== null) { clearTimeout(replyTimer); replyTimer = null }
        replyPlaying = false
        if (replyAudio) {
          try { replyAudio.pause(); replyAudio.currentTime = 0 } catch (error) { /* not loaded */ }
        }
        publish({ replyPlaying: false })
      }

      function playClip(force) {
        if (!force && !replyEnabled) return
        const clip = replyClip()
        if (!clip) return
        stopReply()
        try {
          if (replyAudio === null || replyAudio.dataset.voice !== replyVoice) {
            replyAudio = new Audio(`data:audio/wav;base64,${clip}`)
            replyAudio.dataset.voice = replyVoice
            replyAudio.preload = 'auto'
          } else {
            replyAudio.currentTime = 0
          }
          replyPlaying = true
          publish({ replyPlaying: true })
          const playing = replyAudio.play()
          if (playing && typeof playing.catch === 'function') {
            playing.catch((error) => {
              console.warn('[voice-wake] wake reply playback failed', error)
              replyPlaying = false
              publish({ replyPlaying: false })
            })
          }
          replyAudio.onended = () => {
            if (replyTimer !== null) clearTimeout(replyTimer)
            replyTimer = setTimeout(() => {
              replyTimer = null
              replyPlaying = false
              publish({ replyPlaying: false })
            }, 250)
          }
        } catch (error) {
          console.warn('[voice-wake] wake reply failed', error)
          replyPlaying = false
          publish({ replyPlaying: false })
        }
      }

      function playWakeReply() {
        if (!replyEnabled) return
        playClip(false)
      }

      function setReply(enabledValue) {
        replyEnabled = !!enabledValue
        try { localStorage.setItem(REPLY_KEY, replyEnabled ? '1' : '0') } catch (error) { /* storage unavailable */ }
        publish({ replyEnabled })
        if (!replyEnabled) stopReply()
      }

      function setReplyVoice(voice) {
        replyVoice = voice === 'b' ? 'b' : 'a'
        try { localStorage.setItem(REPLY_VOICE_KEY, replyVoice) } catch (error) { /* storage unavailable */ }
        publish({ replyVoice })
        stopReply()
        replyAudio = null
      }

      function previewReply() {
        playClip(true)
      }

      function syncCapture() {
        if (!enabled) return
        if (speech === null) {
          publish({ phase: 'idle', code: 'starting' })
          return
        }
        if (!store.getSnapshot().usable) {
          publish({ phase: 'waiting', code: 'notReady' })
          return
        }
        if (capture === null && capturePromise === null) void startCapture()
      }

      function setDock(visible) { publish({ dockVisible: visible }) }

      function retryMicrophone() {
        if (enabled) {
          syncCapture()
          return
        }
        void enable()
      }

      async function enable() {
        if (enabled) return
        enabled = true
        abort = new AbortController()
        try { localStorage.setItem(STORAGE_KEY, '1') } catch (error) { /* storage unavailable */ }
        publish({ enabled: true, message: '', detail: '' })
        syncCapture()
      }

      async function disable() {
        if (!enabled) return
        enabled = false
        try { localStorage.setItem(STORAGE_KEY, '0') } catch (error) { /* storage unavailable */ }
        clearArmed()
        clearNotice()
        busy = false
        abort.abort()
        await stopCapture()
        publish({ enabled: false, phase: 'off', code: 'off', detail: '', message: '' })
      }

      function toggle() {
        if (enabled) void disable()
        else void enable()
      }

      async function prepare() {
        if (speech === null) return
        const providerId = catalog ? catalog.selection.providerId : undefined
        if (!providerId) return
        publish({ providerMessage: '' })
        try {
          const result = await speech.prepare(providerId, undefined)
          if (result && result.ok === false) throw new Error(result.error.message)
        } catch (error) {
          console.error('[voice-wake] prepare failed', error)
          fail('error', messageOf(error))
        }
      }

      function dispose() {
        enabled = false
        clearArmed()
        clearNotice()
        if (depsTimer !== null) { clearTimeout(depsTimer); depsTimer = null }
        stopReply()
        replyAudio = null
        abort.abort()
        void stopCapture()
        if (readiness) { try { void readiness.dispose() } catch (error) { /* carrier gone */ } }
        readiness = null
        speech = null
        catalog = null
      }

      // ---- boot ----

      let stored = false
      try { stored = localStorage.getItem(STORAGE_KEY) === '1' } catch (error) { stored = false }
      try { replyEnabled = localStorage.getItem(REPLY_KEY) !== '0' } catch (error) { replyEnabled = true }
      try { replyVoice = localStorage.getItem(REPLY_VOICE_KEY) === 'b' ? 'b' : 'a' } catch (error) { replyVoice = 'a' }
      publish({ replyEnabled, replyVoice })

      depsTimer = setTimeout(() => {
        depsTimer = null
        if (speech !== null) return
        publish({ deps: true })
        if (enabled) publish({ code: 'deps', phase: 'idle' })
      }, 5000)

      if (stored) {
        enabled = true
        publish({ enabled: true, phase: 'starting', code: 'starting' })
      }

      return {
        subscribe: store.subscribe,
        getSnapshot: store.getSnapshot,
        connectSpeech,
        disconnectSpeech,
        setTarget,
        clearTarget,
        setDock,
        toggle,
        retryMicrophone,
        setReply,
        setReplyVoice,
        previewReply,
        stopReply,
        prepare,
        dispose,
      }
    }

    // ----------------------------------------------------------------------
    // UI
    // ----------------------------------------------------------------------

    const STYLE_TEXT = `
.vw-row{display:flex;align-items:center;gap:8px;min-height:24px;padding:1px 2px 1px 10px;margin-left:2px;border-left:1px solid var(--dsw-alias-border-l1);font-size:12px;line-height:1.4;color:var(--dsw-alias-label-secondary);}
.vw-glyph{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center;width:16px;height:16px;color:var(--dsw-alias-state-idle-primary);}
.vw-row[data-live="true"] .vw-glyph{color:var(--dsw-alias-state-success-primary);}
.vw-row[data-tone="error"] .vw-glyph{color:var(--dsw-alias-state-error-primary);}
.vw-row[data-tone="warn"] .vw-glyph{color:var(--dsw-alias-state-warn-primary);}
.vw-text{display:flex;min-width:0;align-items:baseline;gap:8px;flex:1 1 auto;}
.vw-title{flex:0 0 auto;font-weight:500;color:var(--dsw-alias-label-primary);}
.vw-status{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.vw-row[data-live="true"] .vw-status{color:var(--dsw-alias-brand-primary);}
.vw-row[data-tone="error"] .vw-status{color:var(--dsw-alias-state-error-primary);}
.vw-row[data-tone="warn"] .vw-status{color:var(--dsw-alias-state-warn-primary);}
.vw-actions{display:inline-flex;flex:0 0 auto;align-items:center;gap:8px;}
.vw-action{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-size:12px;line-height:1;padding:4px 8px;border-radius:6px;cursor:pointer;}
.vw-action:hover{background:var(--dsw-alias-bg-layer-2);}
.vw-action:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px;}
.vw-switch{position:relative;flex:0 0 auto;width:30px;height:18px;padding:0;border-radius:9px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);cursor:pointer;transition:background .15s ease,border-color .15s ease;}
.vw-switch[aria-checked="true"]{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);}
.vw-switch:disabled{opacity:.45;cursor:not-allowed;}
.vw-switch:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;}
.vw-thumb{position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s ease;}
.vw-switch[aria-checked="true"] .vw-thumb{transform:translateX(12px);}
.vw-hero{display:inline-flex;align-items:center;gap:6px;margin-left:4px;}
.vw-hero .vw-glyph{color:var(--dsw-alias-state-idle-primary);}
.vw-hero[data-live="true"] .vw-glyph{color:var(--dsw-alias-state-success-primary);}
.vw-iconbtn{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;padding:0;border:1px solid transparent;border-radius:6px;background:transparent;color:var(--dsw-alias-state-idle-primary);cursor:pointer;}
.vw-iconbtn[aria-pressed="true"]{color:var(--dsw-alias-state-success-primary);background:var(--dsw-alias-bg-layer-2);}
.vw-iconbtn:disabled{opacity:.45;cursor:not-allowed;}
.vw-iconbtn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px;}
.vw-select{max-width:86px;height:22px;padding:0 2px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-size:12px;}
`

    function MicGlyph({ live }) {
      return h('svg', { viewBox: '0 0 16 16', width: 15, height: 15, 'aria-hidden': true, focusable: false },
        h('rect', { x: 5.6, y: 1.4, width: 4.8, height: 8.2, rx: 2.4, fill: 'currentColor' }),
        h('path', { d: 'M3.4 7.4v.9a4.6 4.6 0 0 0 9.2 0v-.9', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' }),
        h('path', { d: 'M8 12.9v2', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' }),
        live ? h('circle', { cx: 13.4, cy: 2.8, r: 1.9, fill: 'var(--dsw-alias-state-success-primary)' }) : null)
    }

    function SpeakerGlyph({ on }) {
      return h('svg', { viewBox: '0 0 16 16', width: 15, height: 15, 'aria-hidden': true, focusable: false },
        h('path', { d: 'M2.6 6.1h2.6L9.1 3.2v9.6L5.2 9.9H2.6z', fill: 'currentColor' }),
        on
          ? h('path', { d: 'M10.9 5.2c.9.7 1.5 1.7 1.5 2.8s-.6 2.1-1.5 2.8', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' })
          : null)
    }

    const DOWNLOAD_REASONS = new Set(['timeout', 'network', 'dns', 'certificate', 'http', 'integrity', 'storage', 'unknown'])

    function shorten(text, limit) {
      const value = String(text || '')
      return value.length > limit ? value.slice(0, limit) + '…' : value
    }

    function statusOf(state, t) {
      if (state.deps || state.code === 'deps') return { text: t('deps'), tone: 'error' }
      if (state.code === 'error') return { text: t('error', { message: state.message || '' }), tone: 'error', title: state.message || undefined }
      if (state.code === 'micDenied') return { text: t('micDenied'), tone: 'error' }
      if (state.code === 'micMissing') return { text: t('micMissing'), tone: 'error' }
      if (state.code === 'micLost') return { text: t('micLost'), tone: 'error' }
      if (state.code === 'micBusy') return { text: t('micBusy'), tone: 'error' }
      if (state.code === 'noSession') return { text: t('noSession'), tone: 'error' }
      const needPrepare = state.providerPhase === 'unprepared'
        || state.providerPhase === 'failed'
        || state.providerPhase === 'cancelled'
      if (!state.enabled && !needPrepare) return { text: t('offHint'), tone: 'idle' }
      if (state.providerPhase === 'failed') {
        if (state.failureReason && DOWNLOAD_REASONS.has(state.failureReason)) {
          return { text: t('download.' + state.failureReason), tone: 'error', title: state.providerMessage || undefined }
        }
        return {
          text: t('failed', { message: state.providerMessage || state.message || '' }),
          tone: 'error',
          title: state.providerMessage || undefined,
        }
      }
      if (needPrepare) return { text: t('notReady'), tone: 'warn' }
      if (state.providerPhase === 'downloading') {
        const progress = state.progress
        return {
          text: t('downloading', {
            completed: progress ? (progress.completed / 1e6).toFixed(1) : '0.0',
            total: progress && progress.total ? (progress.total / 1e6).toFixed(1) : '?',
          }),
          tone: 'warn',
        }
      }
      if (state.providerPhase === 'checking') return { text: t('checking'), tone: 'warn' }
      if (state.providerPhase === 'loading') return { text: t('loading'), tone: 'warn' }
      if (state.providerPhase === 'waking') return { text: t('waking'), tone: 'warn' }
      if (state.code === 'starting') return { text: t('starting'), tone: 'idle' }
      if (state.code === 'activate') return { text: t('activate'), tone: 'warn' }
      if (state.code === 'transcribing') return { text: t('transcribing'), tone: 'live' }
      if (state.code === 'sending') return { text: t('sending'), tone: 'live' }
      if (state.code === 'sent') {
        return { text: t('sent', { text: shorten(state.detail, 24) }), tone: 'live', title: t('sent', { text: state.detail }) }
      }
      if (state.code === 'heard') {
        return { text: t('heard', { text: shorten(state.detail, 24) }), tone: 'idle', title: t('heard', { text: state.detail }) }
      }
      if (state.code === 'ending') return { text: t('ending'), tone: 'live' }
      if (state.code === 'armed') return { text: t('armed'), tone: 'live' }
      if (state.code === 'capturing') return { text: t('capturing'), tone: 'live' }
      if (state.code === 'idle') return { text: t('idle'), tone: 'live' }
      return { text: t('offHint'), tone: 'idle' }
    }

    function Switch({ checked, disabled, label, title, onClick }) {
      return h('button', {
        type: 'button',
        role: 'switch',
        'aria-checked': checked,
        'aria-label': label,
        title: title || label,
        className: 'vw-switch',
        disabled,
        onClick: () => { if (!disabled) onClick() },
      }, h('span', { className: 'vw-thumb' }))
    }

    function Dock({ sessionId, controller, t }) {
      const state = React.useSyncExternalStore(controller.subscribe, controller.getSnapshot)
      React.useEffect(() => {
        controller.setTarget(sessionId)
        controller.setDock(true)
        return () => {
          controller.clearTarget(sessionId)
          controller.setDock(false)
        }
      }, [sessionId, controller])
      const status = statusOf(state, t)
      const live = state.enabled && ['idle', 'armed', 'capturing', 'ending', 'transcribing', 'sending', 'sent'].includes(state.code)
      const needPrepare = state.providerPhase === 'unprepared'
        || state.providerPhase === 'failed'
        || state.providerPhase === 'cancelled'
      const micFailed = !state.enabled && ['micDenied', 'micMissing', 'micLost', 'micBusy'].includes(state.code)
      const action = needPrepare
        ? h('button', {
          type: 'button',
          className: 'vw-action',
          onClick: () => { void controller.prepare() },
        }, t(state.providerPhase === 'unprepared' ? 'prepare' : 'retry'))
        : micFailed
          ? h('button', {
            type: 'button',
            className: 'vw-action',
            onClick: () => { controller.retryMicrophone() },
          }, t('retryMic'))
          : null
      return h('div', {
        className: 'vw-row',
        'data-live': String(live),
        'data-tone': status.tone,
        'data-state': state.code,
      },
      h('span', { className: 'vw-glyph' }, h(MicGlyph, { live })),
      h('span', { className: 'vw-text' },
        h('span', { className: 'vw-title' }, t('title')),
        h('span', { className: 'vw-status', role: 'status', title: status.title || status.text }, status.text)),
      h('span', { className: 'vw-actions' },
        action,
        state.replyEnabled
          ? h('select', {
            className: 'vw-select',
            'aria-label': t('replyVoiceLabel'),
            title: t('replyVoiceLabel'),
            value: state.replyVoice,
            onChange: (event) => { controller.setReplyVoice(event.target.value) },
          },
          h('option', { value: 'a' }, t('replyVoiceA')),
          h('option', { value: 'b' }, t('replyVoiceB')))
          : null,
        state.replyEnabled
          ? h('button', {
            type: 'button',
            className: 'vw-action',
            onClick: () => { controller.previewReply() },
          }, t('replyPreview'))
          : null,
        h('button', {
          type: 'button',
          className: 'vw-iconbtn',
          'aria-pressed': state.replyEnabled,
          'aria-label': t('replyToggle'),
          title: t('replyToggle'),
          onClick: () => controller.setReply(!state.replyEnabled),
        }, h(SpeakerGlyph, { on: state.replyEnabled })),
        h(Switch, {
          checked: state.enabled,
          disabled: state.deps && !state.enabled,
          label: t('switchLabel'),
          title: state.deps ? t('deps') : t('switchLabel'),
          onClick: () => controller.toggle(),
        })))
    }

    function HeroControl({ sessionId, controller, t }) {
      const state = React.useSyncExternalStore(controller.subscribe, controller.getSnapshot)
      React.useEffect(() => {
        controller.setTarget(sessionId)
        return () => controller.clearTarget(sessionId)
      }, [sessionId, controller])
      if (state.dockVisible) return null
      const status = statusOf(state, t)
      return h('span', {
        className: 'vw-hero',
        'data-live': String(state.enabled),
        title: `${t('title')} · ${status.text}`,
      },
      h('span', { className: 'vw-glyph' }, h(MicGlyph, { live: state.enabled })),
      h(Switch, {
        checked: state.enabled,
        disabled: state.deps && !state.enabled,
        label: t('switchLabel'),
        title: state.deps ? t('deps') : status.text,
        onClick: () => controller.toggle(),
      }))
    }

    // ----------------------------------------------------------------------
    // Plugin
    // ----------------------------------------------------------------------

    // Wake-reply voice pack: community VITS (Theresa / Eula) converted by sherpa-onnx, 22.05 kHz PCM16 WAV.
    const WAKE_REPLIES = [
      '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',
    ]

    return {
      inject: ['slots', 'locale', 'sessions', 'remote'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, LOCALES))
        ctx.effect(() => {
          const style = document.createElement('style')
          style.id = 'voice-wake-style'
          style.dataset.plugin = '@local/voice-wake'
          style.textContent = STYLE_TEXT
          document.head.append(style)
          return () => style.remove()
        })

        const controller = createController(ctx)
        ctx.effect(() => () => { controller.dispose() })

        ctx.effect(() => {
          const scope = ctx.inject(['remote.speech'], (injection) => {
            try { controller.connectSpeech(injection.remote || ctx.remote) }
            catch (error) { console.error('[voice-wake] speech connect failed', error) }
            injection.effect(() => () => { void controller.disconnectSpeech() })
          })
          return () => { if (scope && typeof scope.dispose === 'function') void scope.dispose() }
        })

        ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
          name: 'conversation.composer.dock',
          id: 'voice-wake',
          order: 4,
          locale: NS,
        }, (props) => h(Dock, { sessionId: props.sessionId, controller, t: props.t })))

        // A blank Session renders the hero composer without the dock; expose the switch there instead.
        ctx.slots.inject('conversation.hero.options', () => ctx.slots.register({
          name: 'conversation.hero.options',
          id: 'voice-wake-hero',
          order: 10,
          locale: NS,
        }, (props) => h(HeroControl, { sessionId: props.sessionId, controller, t: props.t })))
      },
    }
  },
})

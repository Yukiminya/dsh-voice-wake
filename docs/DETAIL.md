# Hands-free voice wake word

Keeps one microphone stream open and turns a spoken wake word plus one sentence into a normal DeepSeek Harness prompt.

## Use

1. Turn the microphone on for **Voice input** first (Plugins → Voice input → download/prepare the local model). This bundle recognizes speech through that plugin's local SenseVoice provider.
2. Under the composer, switch **Hands-free voice** on and allow microphone access.
3. Say **大肥鱼来** and then your command in the same breath, for example “大肥鱼来，帮我看看今天的日程”. Speaking the wake word alone also works: it answers “来了”, the row shows “我在听，请说指令”, and the next sentence is used.
4. When you stop speaking for two seconds the recording ends, the sentence is transcribed, and it is sent to the current session as a normal prompt. The agent then runs it as usual.
5. The row under the composer holds the **reply-voice** selector, **Preview**, the speaker toggle and the microphone switch. With the speaker on, every detected wake word is answered with “来了” in the selected anime voice; the two voices can be compared and the choice is remembered.
6. The microphone pauses for about a second while the clip plays, so the reply does not trigger a new command, and it resumes afterwards.

The switch is remembered per browser profile: leaving it on keeps the microphone open after a page reload until you switch it off.

## Behavior

- One utterance is transcribed at a time; while a sentence is being recognized or sent, new speech is ignored.
- A wake word inside a longer sentence is removed, and the rest becomes the command.
- After a bare wake word the next sentence is treated as the command for 15 seconds; after that the switch returns to listening for the wake word again.
- Every complete utterance is transcribed even without the wake word, which is what makes “wake word only” work. Utterances without the wake word are only shown as the last thing that was heard.

## Requirements

- The shipped **Voice input** plugin (`@deepseek-ai/dsh-experimental-voice-input-bundle`) must be enabled. Without it the switch reports that speech recognition is unavailable.
- The speech model must be prepared once (about 240 MB, downloaded on demand). The row shows download progress and offers **Download speech model** while it is not ready.
- Electron grants microphone access to the main window only; `getUserMedia` needs a secure origin (the desktop app uses its own secure scheme) or a loopback page.
- The switch sits with the composer of a Session. A brand-new empty Session shows the hero composer instead; there the switch appears on the workspace/preset row above the input, and commands still target that Session.

## Privacy and limits

- Audio is sent only to the local DeepSeek Harness host for transcription and is not written into the session; only the recognized text becomes a normal user prompt.
- The reply voice is a pre-generated local audio pack (synthesized with sherpa-onnx from an anime-character VITS model, 22.05 kHz WAV shipped in the bundle). Playback uses no network and no system speech voice; this bundle does not read DSH replies aloud.
- The voices come from the community VITS model `vits-zh-hf-theresa` published by k2-fsa (trained on Genshin / Honkai Impact 3 voices and converted to onnx) and are for personal local use; the bundle carries only the two “来了” clips, not the model.
- A bare wake word finishes listening after about one second and gets the reply; once it is waiting for a command, the command still ends after two seconds of silence.
- Recognition is utterance based, not streaming: there are no live captions.
- Background noise above the adaptive threshold can start an utterance; in a very noisy room, say the wake word every time or switch the microphone off.
- The bundle adds no Host service of its own; capture, playback and state all live in the browser half.

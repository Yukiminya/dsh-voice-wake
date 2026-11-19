# 免提语音唤醒（dsh-voice-wake）

DeepSeek Harness 插件：常开麦克风，说「**大肥鱼来**」时用二次元音色回一声「**来了**」，再说一句话，停顿两秒后自动把这句话作为普通提问发送给 DSH 执行。

- 唤醒词可以单独说（先回应「来了」，再等你讲命令），也可以和命令一口气说：「大肥鱼来，帮我看看今天的日程」。
- 输入框下方一行里有：麦克风开关、状态、应答音色（两种）、试听、应答开关；状态会显示聆听中 / 我在听 / 停顿中 / 识别中 / 已发送 / 刚听到的内容。
- 语音识别用 DSH 自带的本地 SenseVoice（离线，音频不出本机）；回应音频已打包在插件里，不联网。

## 依赖（必须先装）

1. 启用 DSH 自带的 **语音输入** 插件（`@deepseek-ai/dsh-experimental-voice-input-bundle`）。
2. 按它的提示准备本地语音模型（SenseVoice，约 240 MB，首次下载）。

没有「语音输入」插件时，本插件那一行会提示「未启用『语音输入』插件」。

## 安装

### 从 GitHub 安装

DSH →「插件」→ 右上角添加插件 →「安装第三方插件」→ 填仓库地址：

```
https://github.com/Yukiminya/dsh-voice-wake
```

安装并启用后**刷新页面**（Ctrl+R / Cmd+R）。

### 本地目录安装

下载本仓库为 zip，解压到固定目录，然后在同一入口选择「本地目录」并选中该文件夹。本地目录安装是链接，之后不要移动或删除文件夹。

## 使用

1. 打开麦克风开关并允许麦克风权限。
2. 说「大肥鱼来」→ 听到「来了」→ 状态变成「我在听，请说指令」→ 说你的命令。
3. 说完停顿两秒，整句识别后发送。
4. 不需要回应声时点喇叭开关；两种音色可用「试听」比较，选择会记住。

## 兼容性

- 在 DSH `0.2.2-rc.5` 上测试；界面使用 `conversation.composer.dock`、`conversation.hero.options` 等槽位，过旧版本可能不显示。
- 纯客户端插件：没有 Host 服务、没有原生模块、没有 npm 依赖，Windows / macOS / Linux 通用。

## 音色与许可

- 代码以 MIT 许可发布，见 [LICENSE](LICENSE)。
- 「来了」的两段音频是用 [sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx) 跑社区 VITS 模型 [`vits-zh-hf-theresa`](https://github.com/k2-fsa/sherpa-onnx/releases/tag/tts-models)（由原神 / 崩坏3 语音训练并转换）合成的，**仅作个人使用示例，不在 MIT 授权范围内**；如需公开或商业分发，请替换成你自己的音色，见 [NOTICE](NOTICE)。

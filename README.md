# 🌈 Kroma

<div align="center">
  <img src="public/kroma-logo.png" width="100" />
  <h1>Kroma Chat</h1>
  <p>The most inclusive, modern, and high-performance Twitch chat overlay.</p>
</div>

---

## ✨ Features

Kroma is designed to be **beautiful**, **performant**, and **inclusive**. It renders your chat with stunning glassmorphism effects while prioritizing identity and accessibility.

### 🏳️‍🌈 Inclusive & Accessible
- **Pronouns Support**: First-class integration with [Alejo.io](https://pr.alejo.io) to display user pronouns automatically.
- **Identity Friendly**: Built to respect and highlight user identities.
- **Accessibility**: High contrast modes, adjustable font sizes, and clear typography (Inter/Segoe UI).

### 💬 Universal Chat
- **Shared Chat Support**: The **only** overlay with native support for Twitch's "Stream Together" (Guest Star) shared chats.
- **Rich Emotes**: Seamless support for **7TV**, **BetterTTV (BTTV)**, and **FrankerFaceZ (FFZ)**.
- **Name Paints**: Renders 7TV gradient usernames/paints for that premium feel.

### 🎨 Modern Personalization
- **Glassmorphism Design**: Sleek, frosted-glass aesthetics that look great on any stream.
- **Custom Fonts**: Use ANY font installed on your computer.
- **Emote Scaling**: Make emotes huge (up to 3x size) for maximum hype.
- **Smart Fading**: Automatically fade out old messages to keep your overlay clean.
- **Custom Filters**: Hide specific users or custom bots with a simple blocklist.


---

## 🚀 Quick Start

1. Go to the **Setup Page** at [kroma.scaptiq.live](https://kroma.scaptiq.live).
2. Enter your **Twitch Username**.
3. Customize your settings in the **Appearance** tab.
4. Drag the **"Drag to OBS"** button directly into your OBS Sources list.

---

## 🛠 Advanced Features

### URL Parameters
You can manually configure your overlay via URL parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `channels` | string | (Required) | Comma-separated list of channels to join. |
| `pronouns` | boolean | `true` | Show/hide pronouns. |
| `badges` | boolean | `true` | Show/hide subscriber/bit badges. |
| `emotes` | boolean | `true` | Show/hide 3rd party emotes. |
| `emoteScale`| number | `1.0` | Scale multiplier for emotes (e.g. `1.5` = 150%). |
| `paints` | boolean | `true` | Show/hide 7TV name paints. |
| `shared` | boolean | `true` | Show/hide Shared Chat (Guest Star) source icons. |
| `fadeOut` | boolean | `false` | Enable message fading. |
| `fadeDelay` | number | `30000` | Delay in ms before fading out (if enabled). |
| `font` | string | `Segoe UI` | Font family name. |
| `fontSize` | number | `16` | Font size in pixels. |

### Development

Kroma is built with [SolidStart](https://start.solidjs.com) and Vite for blazing fast performance.

#### Run Locally
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

#### Build for Production
```bash
npm run build
```

---

## Credits

Created by **scaptiq**.
Originally based on [ChatIS](https://github.com/IS2511/ChatIS).
Licensed under MIT.

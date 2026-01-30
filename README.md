# 🌈 Kroma

<div align="center">
  <img src="public/kroma-logo.png" width="120" />
  <h1>Kroma Chat</h1>
  <p><strong>The most inclusive Twitch chat overlay.</strong></p>
  <p>Built for streamers who care about identity, accessibility, and aesthetics.</p>
</div>

---

## 💡 What is Kroma?

**Kroma** is a browser-based chat overlay for OBS that displays your Twitch chat with a focus on **inclusivity** and **modern design**. Unlike other overlays, Kroma puts identity first:

- 🏳️‍🌈 **Pronoun badges** are color-coded by default and can be switched to animated pride rainbows
- 🎨 **7TV paints** and emotes render beautifully
- 👥 **Shared Chat** (Stream Together) is fully supported — the *only* overlay that does this

Whether you're a small streamer or a major broadcaster, Kroma makes your chat look premium while respecting your community's identities.

---

## ✨ Key Features

### 🏳️‍🌈 Inclusive by Design

| Feature | Description |
|---------|-------------|
| **Pronouns** | Automatic integration with [Alejo.io](https://pr.alejo.io) — no setup needed |
| **Color-Coded Badges** | Each pronoun gets its own unique color (see table below) |
| **Pride Mode** | Toggle animated rainbow badges for everyone 🌈 |
| **First-Time Chatter** | Highlights users chatting for the first time |

### 🎨 Pronoun Badge Colors

| Pronoun | Color | Style |
|---------|-------|-------|
| he/him | 🔵 Blue | Solid |
| she/her | 💗 Pink | Solid |
| they/them | 💜 Purple | Solid |
| it/its | 🩵 Teal | Solid |
| he/they | 🔵→💜 | Gradient |
| she/they | 💗→💜 | Gradient |
| ae/aer | 🩵 Cyan | Solid |
| e/em | 💜 Violet | Solid |
| fae/faer | 🩷 Fuchsia | Solid |
| per/per | 🧡 Amber | Solid |
| ve/ver | 💚 Emerald | Solid |
| xe/xem | 💙 Indigo | Solid |
| zie/hir | 🩷 Light Pink | Solid |
| any | 🌈 Rainbow | Animated |
| other / ask | ⬜ Gray | Solid |

> **Pride Mode**: When enabled, *all* pronoun badges become animated rainbow gradients!

---

### 💬 Complete Chat Support

| Feature | Description |
|---------|-------------|
| **Shared Chat** | Native support for Twitch "Stream Together" — shows which channel each message came from |
| **7TV / BTTV / FFZ** | Full emote support from all major providers |
| **Name Paints** | Renders 7TV gradient usernames |
| **Reply Threading** | Shows reply context for threaded conversations |
| **Bits & Cheers** | Displays cheer emotes and bit amounts |

---

### 🎨 Personalization

| Feature | Description |
|---------|-------------|
| **Glassmorphism** | Sleek frosted-glass aesthetic |
| **Custom Fonts** | Use any Google Font or system font |
| **Emote Scaling** | Scale emotes up to 3x size |
| **Message Fading** | Automatically fade out old messages |
| **Bot Filtering** | Hide known bots and custom accounts |
| **Command Hiding** | Optionally hide `!commands` |

---

## 🚀 Quick Start

1. Go to **[kroma.scaptiq.live](https://kroma.scaptiq.live)**
2. Enter your **Twitch username**
3. Customize settings in **General**, **Visuals**, and **Filters** tabs
4. **Drag the "Drag to OBS" button** directly into your OBS Sources

> **Recommended browser source size:** 450×800

---

## 🛠 URL Parameters

For advanced users, you can configure the overlay via URL:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `pronouns` | boolean | `true` | Show pronoun badges |
| `pridePronouns` | boolean | `false` | 🌈 Use animated rainbow badges |
| `badges` | boolean | `true` | Show Twitch badges |
| `emotes` | boolean | `true` | Show 7TV/BTTV/FFZ emotes |
| `emoteScale` | number | `1.0` | Emote size multiplier |
| `paints` | boolean | `true` | Show 7TV name paints |
| `shared` | boolean | `true` | Show Shared Chat icons |
| `replies` | boolean | `true` | Show reply threading |
| `timestamps` | boolean | `false` | Show message times |
| `fadeOut` | boolean | `false` | Enable message fading |
| `fadeDelay` | number | `30000` | Fade delay in ms |
| `font` | string | `Segoe UI` | Font family (Google Fonts supported) |
| `fontSize` | number | `16` | Font size in pixels |
| `maxMessages` | number | `50` | Max messages shown |
| `hideCommands` | boolean | `false` | Hide `!command` messages |
| `hideBots` | boolean | `false` | Hide known bots |
| `blocked` | string | | Comma-separated blocked users |
| `bots` | string | | Comma-separated custom bots |

### Example
```
https://kroma.scaptiq.live/v3/chat/yourChannel?pridePronouns=true&fontSize=20&font=Comic+Neue
```

---

## 🧑‍💻 Development

Kroma is built with [SolidStart](https://start.solidjs.com) + Vite for blazing fast performance.

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

---

## 📜 Credits

Created by **[scaptiq](https://github.com/scaptiq)**.

Originally based on [ChatIS](https://github.com/IS2511/ChatIS) by IS2511.

Licensed under **MIT**.

---

<div align="center">
  <p>Made with 💜 for inclusive streaming</p>
</div>

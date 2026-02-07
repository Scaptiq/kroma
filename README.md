# 🌈 Kroma

<div align="center">
  <img src="public/kroma-logo.png" width="120" />
  <h1>Kroma Chat</h1>
  <p><strong>The most inclusive Twitch, Kick, YouTube, and Velora chat overlay.</strong></p>
  <p>Built for streamers who care about identity, accessibility, and aesthetics.</p>
</div>

---

## 💡 What is Kroma?

**Kroma** is a premium browser-based chat overlay for OBS that displays your **Twitch**, **Kick**, **YouTube**, or **Velora** chat with a focus on **inclusivity** and **modern design**. 

- 🏳️‍🌈 **Identity First**: Fully integrated pronouns (Alejo.io) and pride-themed badges.
- 🎨 **Beautiful Aesthetics**: Supports 7TV name paints, custom gradients, and frosted-glass UI.
- 🚀 **Multi-Platform**: Combine Twitch, Kick, YouTube, and Velora into a single, seamless overlay.
- 👥 **Shared Chat**: The only overlay with native support for Twitch "Stream Together".
- 🛠️ **Configurator**: Powerful [setup page](https://kroma.scaptiq.live/v3/) to customize everything without code.

---

## ✨ Key Features

### 🏳️‍🌈 Inclusive by Design

| Feature | Description |
|---------|-------------|
| **Pronouns** | Automatic integration with [Alejo.io](https://pr.alejo.io) — no setup needed (Twitch only) |
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
| **Shared Chat** | Native support for Twitch "Stream Together" (Twitch only) |
| **7TV / BTTV / FFZ** | Full emote support (Twitch/Kick/YouTube - 7TV everywhere!) |
| **Name Paints** | Renders 7TV gradient usernames (Twitch/Kick/YouTube) |
| **Velora Emotes** | Native Velora emotes + on-demand resolve |
| **Reply Threading** | Shows reply context for threaded conversations (Twitch only) |
| **Bits & Cheers** | Displays cheer emotes and bit amounts (Twitch only) |
| **Platform Badge** | Optional icons to distinguish Twitch, Kick, and YouTube messages |

---

### 🎉 Event Alerts

| Feature | Description |
|---------|-------------|
| **Subscription Alerts** | Special purple styling for new subs and resubs with month count |
| **Gift Sub Alerts** | Green styling with 🎁 icon for gift subs and community gifts |
| **Raid Alerts** | Animated red styling with viewer count when someone raids |
| **Mod Actions** | Shows timeouts and bans with username (italic orange styling) |
| **Deleted Messages** | Crossed-out, faded styling for deleted messages |

---

### 📋 Room State Indicators (Twitch Only)

Badges appear at the top of the overlay when chat restrictions are active:

| Mode | Badge | Description |
|------|-------|-------------|
| **Slow Mode** | 🐢 | Shows delay between messages (e.g., "30s") |
| **Emote Only** | 😀 | Chat is emote-only |
| **Followers Only** | 💜 | Shows follower time requirement |
| **Sub Only** | ⭐ | Subscribers-only mode |
| **R9K/Unique** | 🤖 | Messages must be unique |

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
2. Choose Twitch, Kick, YouTube, Velora, or Combined
3. Enter your channel name(s)
4. Customize settings in **General**, **Visuals**, and **Filters** tabs
4. **Drag the "Drag to OBS" button** directly into your OBS Sources

> **Recommended browser source size:** 450×800

---

## 🛠 URL Parameters

For advanced users, you can configure the overlay via URL.

**Base URLs**

| Mode | Base URL |
|------|----------|
| Single platform | `/chat/{platform}/{channel}` |
| Combined | `/chat/combined` |

Supported `{platform}` values: `twitch`, `kick`, `youtube`, `velora`.

Legacy URLs like `/chat/{channel}` still work and redirect to the canonical path.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `platforms` | string | `twitch` | Comma-separated: `twitch`, `kick`, `youtube`, `velora` |
| `twitch` | string | | Twitch channel name |
| `kick` | string | | Kick channel name |
| `youtube` | string | | YouTube handle (without `@`) |
| `velora` | string | | Velora username |
| `platformBadge` | boolean | `true` | Show platform icon before badges |
| `pronouns` | boolean | `true` | Show pronoun badges (Twitch only) |
| `pridePronouns` | boolean | `false` | 🌈 Use animated rainbow badges |
| `badges` | boolean | `true` | Show badges (Twitch + Kick) |
| `highlights` | boolean | `true` | Show highlighted messages / message effects |
| `emotes` | boolean | `true` | Show emotes (incl. 7TV on all platforms) |
| `emoteScale` | number | `1.0` | Emote size multiplier |
| `paints` | boolean | `true` | Show 7TV name paints (All platforms) |
| `roomState` | boolean | `false` | Show room state indicators (Twitch only) |
| `shared` | boolean | `true` | Show Shared Chat icons (Twitch only) |
| `replies` | boolean | `true` | Show reply threading (Twitch only) |
| `timestamps` | boolean | `false` | Show message times |
| `fadeOut` | boolean | `false` | Enable message fading |
| `fadeDelay` | number | `30000` | Fade delay in ms |
| `font` | string | `Segoe UI` | Font family (Google Fonts supported) |
| `fontSize` | number | `16` | Font size in pixels |
| `maxMessages` | number | `50` | Max messages shown |
| `bg` | string | `transparent` | Page background: `transparent`, `dim`, `dark` |
| `msgBg` | number | `0` | Message background opacity (0–0.9) |
| `textColor` | string | `#ffffff` | Default text color (hex) |
| `sound` | boolean | `false` | Play a sound on new messages |
| `hideCommands` | boolean | `false` | Hide `!command` messages |
| `hideBots` | boolean | `false` | Hide known bots |
| `blocked` | string | | Comma-separated blocked users |
| `bots` | string | | Comma-separated custom bots |

### Examples
```
https://kroma.scaptiq.live/chat/twitch/yourChannel?pridePronouns=true&fontSize=20&font=Comic+Neue
```
```
https://kroma.scaptiq.live/chat/combined?platforms=twitch,youtube&twitch=yourChannel&youtube=yourChannel
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

### Environment Variables
- `YOUTUBE_API_KEY`: Enables YouTube live chat polling (Cloudflare Pages env or local `.env`).
- `VELORA_ACCESS_TOKEN`: Optional if Velora API requires auth for user search or emotes.

---

## 📜 Credits

Created by **[scaptiq](https://github.com/scaptiq)**.

Originally based on [ChatIS](https://github.com/IS2511/ChatIS) by IS2511.

Licensed under **MIT**.

---

<div align="center">
  <p>Made with 💜 for inclusive streaming</p>
</div>

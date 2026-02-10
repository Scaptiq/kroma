import type { ChatMessage } from "~/utils/messageTypes";

export const generateColor = (username: string): string => {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 60%)`;
};

export const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
};

export const isClearChatNotice = (content: string) => {
    const lowered = content.toLowerCase();
    return lowered.includes('cleared the chat');
};

export const getMessageClass = (msg: ChatMessage): string => {
    const classes = ['chat-message'];

    if (msg.type === 'action') classes.push('chat-message--action');
    if (msg.platform === 'velora' && msg.veloraCard?.type) {
        classes.push('chat-message--velora-card');
    }

    return classes.join(' ');
};

export const getMessageBubbleClass = (
    msg: ChatMessage,
    options: {
        showHighlights: boolean;
        showFirstMessage: boolean;
        deletedMessages: Set<string>;
    }
): string => {
    const classes = ['message-bubble'];

    if (msg.type === 'sub') classes.push('message-sub');
    if (msg.type === 'resub') classes.push('message-resub');
    if (msg.type === 'subgift') classes.push('message-subgift');
    if (msg.type === 'submysterygift') classes.push('message-submysterygift');
    if (msg.type === 'raid') classes.push('message-raid');
    if (msg.type === 'announcement') classes.push('chat-message--announcement');
    if (msg.type === 'system' && (msg.platform !== 'velora' || (options.showHighlights && !msg.veloraCard?.type))) {
        classes.push('message-modaction');
    }
    if (msg.platform === 'velora' && msg.veloraCard?.type === 'gift-celebration') {
        classes.push('message-velora-giftcard');
    }
    if (msg.platform === 'velora' && msg.veloraCard?.type === 'subscription-celebration') {
        classes.push('message-velora-subcard');
    }
    if (msg.platform === 'velora' && msg.veloraCard?.type === 'points-celebration') {
        classes.push('message-velora-pointscard');
    }
    if (msg.platform === 'velora' && msg.veloraCard?.type === 'volts-celebration') {
        classes.push('message-velora-voltscard');
    }
    if (msg.platform === 'velora' && msg.veloraCard?.type === 'raid-celebration') {
        classes.push('message-velora-raidcard');
    }
    if (msg.isHighlighted && options.showHighlights) classes.push('chat-message--highlighted');
    if (msg.isFirstMessage && options.showFirstMessage) classes.push('chat-message--first');

    if (msg.platform === 'velora' && msg.effect && options.showHighlights) {
        classes.push('velora-effect');
        classes.push(`velora-effect--${msg.effect}`);
    }

    if (options.deletedMessages.has(msg.id)) classes.push('message-deleted');

    return classes.join(' ');
};

export const createSoundPlayer = (getPlaySound: () => boolean) => {
    let audioContext: AudioContext | null = null;
    let lastSoundAt = 0;

    const playMessageSound = () => {
        if (!getPlaySound()) return;
        const now = Date.now();
        if (now - lastSoundAt < 150) return;
        lastSoundAt = now;

        try {
            const Ctx = window.AudioContext || (window as any).webkitAudioContext;
            if (!Ctx) return;
            if (!audioContext) audioContext = new Ctx();
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            const gain = audioContext.createGain();
            const current = audioContext.currentTime;
            const base = audioContext.createOscillator();
            const overtone = audioContext.createOscillator();

            base.type = 'sine';
            overtone.type = 'sine';
            base.frequency.setValueAtTime(880, current);
            overtone.frequency.setValueAtTime(1320, current);

            gain.gain.setValueAtTime(0.0001, current);
            gain.gain.exponentialRampToValueAtTime(0.12, current + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, current + 0.25);

            base.connect(gain);
            overtone.connect(gain);
            gain.connect(audioContext.destination);

            base.start(current);
            overtone.start(current);
            base.stop(current + 0.3);
            overtone.stop(current + 0.3);
        } catch {
            // Ignore autoplay or audio context errors
        }
    };

    const maybePlayMessageSound = (timestamp: number) => {
        if (!getPlaySound()) return;
        if (Date.now() - timestamp > 5000) return;
        playMessageSound();
    };

    return { playMessageSound, maybePlayMessageSound };
};

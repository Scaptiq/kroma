import { useParams, useSearchParams } from "solid-start";
import { createSignal, onMount, onCleanup, For, Show, createEffect } from "solid-js";
import tmi from "tmi.js";
import MySiteTitle from "~/components/MySiteTitle";

// Utils
import { getUserPronouns } from "~/utils/pronouns";
import { get7TVUserPaint, getNamePaintStyles, preloadPaints, type NamePaint } from "~/utils/paints";
import { getChannelByRoomId, parseSourceBadges, cacheChannelByUsername } from "~/utils/sharedChat";
import {
    fetchGlobalTwitchBadges,
    fetchChannelTwitchBadges,
    getTwitchBadgeUrl,
    fetch7TVUserBadges,
    fetchFFZUserBadges,
    preload7TVBadges,
    type Badge
} from "~/utils/badges";
import {
    fetch7TVGlobalEmotes, fetch7TVChannelEmotes,
    fetchBTTVGlobalEmotes, fetchBTTVChannelEmotes,
    fetchFFZGlobalEmotes, fetchFFZChannelEmotes,
    type Emote
} from "~/utils/emotes";
import {
    type ChatMessage,
    type MessageType,
    type ParsedPart,
    type ReplyInfo,
    getMessageBackgroundColor,
    ZERO_WIDTH_EMOTES,
    getCheerTierColor
} from "~/utils/messageTypes";

// Configuration interface
interface ChatConfig {
    showPronouns: boolean;
    showBadges: boolean;
    showEmotes: boolean;
    showTimestamps: boolean;
    showSharedChat: boolean;
    showNamePaints: boolean;
    showReplies: boolean;
    showFirstMessage: boolean;
    maxMessages: number;
    hideCommands: boolean;
    hideBots: boolean;
    fadeOutMessages: boolean;
    fadeOutDelay: number;
    fontSize: number;
    fontFamily: string;
    emoteScale: number;
    blockedUsers: string[];
    customBots: string[];
}

const DEFAULT_CONFIG: ChatConfig = {
    showPronouns: true,
    showBadges: true,
    showEmotes: true,
    showTimestamps: false,
    showSharedChat: true,
    showNamePaints: true,
    showReplies: true,
    showFirstMessage: true,
    maxMessages: 50,
    hideCommands: false,
    hideBots: false,
    fadeOutMessages: false,
    fadeOutDelay: 30000,
    fontSize: 16,
    fontFamily: 'Segoe UI',
    emoteScale: 1.0,
    blockedUsers: [],
    customBots: [],
};

// Known bot usernames
const KNOWN_BOTS = new Set([
    'nightbot', 'streamelements', 'moobot', 'fossabot', 'streamlabs',
    'soundalerts', 'wizebot', 'botisimo', 'coebot', 'deepbot', 'phantombot',
    'stay_hydrated_bot', 'streamholics', 'anotherttvviewer', 'commanderroot',
    'drapsnern'
]);

export default function Chat() {
    const params = useParams<{ channel: string }>();
    const [searchParams] = useSearchParams();

    // State
    const [messages, setMessages] = createSignal<ChatMessage[]>([]);
    const [isConnected, setIsConnected] = createSignal(false);
    const [channelId, setChannelId] = createSignal<string | null>(null);

    // Refs
    let client: tmi.Client | null = null;
    let keepAlive = true;
    let messageContainer: HTMLUListElement | undefined;

    // Emote storage
    let global7TV: Emote[] = [];
    let channel7TV: Emote[] = [];
    let globalBTTV: Emote[] = [];
    let channelBTTV: Emote[] = [];
    let globalFFZ: Emote[] = [];
    let channelFFZ: Emote[] = [];

    // Parse config from URL params
    const config: ChatConfig = {
        ...DEFAULT_CONFIG,
        showPronouns: searchParams.pronouns !== 'false',
        showBadges: searchParams.badges !== 'false',
        showEmotes: searchParams.emotes !== 'false',
        showTimestamps: searchParams.timestamps === 'true',
        showSharedChat: searchParams.shared !== 'false',
        showNamePaints: searchParams.paints !== 'false',
        hideCommands: searchParams.hideCommands === 'true',
        hideBots: searchParams.hideBots === 'true',
        maxMessages: parseInt(searchParams.maxMessages || '50') || 50,
        fontSize: parseInt(searchParams.fontSize || '16') || 16,
        fontFamily: searchParams.font || 'Segoe UI',
        fadeOutMessages: searchParams.fadeOut === 'true',
        fadeOutDelay: parseInt(searchParams.fadeDelay || '30000') || 30000,
        emoteScale: parseFloat(searchParams.emoteScale || '1') || 1,
        blockedUsers: searchParams.blocked ? searchParams.blocked.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : [],
        customBots: searchParams.bots ? searchParams.bots.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : [],
    };

    // Scroll to bottom when new messages arrive
    createEffect(() => {
        const _ = messages();
        if (messageContainer) {
            requestAnimationFrame(() => {
                messageContainer!.scrollTop = messageContainer!.scrollHeight;
            });
        }
    });

    /**
     * Find emote in all providers
     */
    const findEmote = (code: string): Emote | null => {
        // Priority: Channel > Global, 7TV > BTTV > FFZ
        return channel7TV.find(e => e.code === code) ||
            channelBTTV.find(e => e.code === code) ||
            channelFFZ.find(e => e.code === code) ||
            global7TV.find(e => e.code === code) ||
            globalBTTV.find(e => e.code === code) ||
            globalFFZ.find(e => e.code === code) ||
            null;
    };

    /**
     * Parse message content into parts (text, emotes, cheers)
     */
    const parseMessageContent = (
        text: string,
        twitchEmotes: { [id: string]: string[] } | undefined,
        bits?: number
    ): ParsedPart[] => {
        // First, handle Twitch native emotes
        let parts: { start: number; end: number; type: 'emote'; content: ParsedPart }[] = [];

        if (twitchEmotes && config.showEmotes) {
            Object.entries(twitchEmotes).forEach(([id, ranges]) => {
                ranges.forEach(range => {
                    const [start, end] = range.split("-").map(Number);
                    const emoteName = text.substring(start, end + 1);
                    parts.push({
                        start,
                        end: end + 1,
                        type: "emote",
                        content: {
                            type: "emote",
                            url: `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/2.0`,
                            name: emoteName,
                            provider: 'twitch'
                        }
                    });
                });
            });
        }

        parts.sort((a, b) => a.start - b.start);

        const finalParts: ParsedPart[] = [];
        let cursor = 0;

        const processTextChunk = (chunk: string) => {
            if (!chunk) return;

            const words = chunk.split(/(\s+)/);

            for (let i = 0; i < words.length; i++) {
                const word = words[i];
                const trimmed = word.trim();

                if (!trimmed) {
                    finalParts.push(word);
                    continue;
                }

                // Check for third-party emotes
                if (config.showEmotes) {
                    const emote = findEmote(trimmed);
                    if (emote) {
                        const isZeroWidth = ZERO_WIDTH_EMOTES.has(trimmed);
                        finalParts.push({
                            type: "emote",
                            url: emote.url,
                            name: emote.code,
                            provider: emote.provider,
                            isZeroWidth
                        });
                        continue;
                    }
                }

                // Regular text
                finalParts.push(word);
            }
        };

        parts.forEach(part => {
            if (part.start > cursor) {
                processTextChunk(text.substring(cursor, part.start));
            }
            finalParts.push(part.content);
            cursor = part.end;
        });

        if (cursor < text.length) {
            processTextChunk(text.substring(cursor));
        }

        return finalParts.filter(p => p !== "");
    };

    /**
     * Get badges for a user
     */
    const getUserBadges = async (
        twitchBadges: tmi.Badges | undefined,
        userId: string
    ): Promise<Badge[]> => {
        const badges: Badge[] = [];
        const currentChannelId = channelId();

        // Twitch badges
        if (twitchBadges && config.showBadges) {
            Object.entries(twitchBadges).forEach(([name, version]) => {
                if (!version) return;
                const url = getTwitchBadgeUrl(name, String(version), currentChannelId || undefined);
                if (url) {
                    badges.push({
                        id: `twitch-${name}`,
                        title: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                        url,
                        provider: 'twitch'
                    });
                }
            });
        }

        return badges;
    };

    /**
     * Handle incoming chat message
     */
    const handleMessage = async (
        channel: string,
        tags: tmi.ChatUserstate,
        message: string,
        self: boolean
    ) => {
        const username = tags.username || 'unknown';
        const userId = tags['user-id'] || '';

        // Filter bots
        if (config.hideBots && KNOWN_BOTS.has(username.toLowerCase())) {
            return;
        }

        // Filter custom blocked users
        if (config.blockedUsers.includes(username.toLowerCase())) {
            return;
        }

        // Filter custom bots
        if (config.customBots.includes(username.toLowerCase())) {
            return;
        }

        // Filter commands
        if (config.hideCommands && message.startsWith('!')) {
            return;
        }

        // Determine message type
        let messageType: MessageType = 'chat';
        const isAction = tags['message-type'] === 'action';
        const isFirstMsg = tags['first-msg'] === true;

        if (isAction) messageType = 'action';
        if (isFirstMsg) messageType = 'firstmessage';
        if (tags['msg-id'] === 'highlighted-message') messageType = 'highlighted';

        // Check for shared chat
        const sourceRoomId = tags['source-room-id'] as string | undefined;
        const currentRoomId = tags['room-id'];
        const isShared = !!(sourceRoomId && currentRoomId && sourceRoomId !== currentRoomId);

        // Handle source badges for shared chat
        const sourceBadgesRaw = (tags as any)['source-badges'] as string | undefined;
        const badgeSource = isShared && sourceBadgesRaw
            ? parseSourceBadges(sourceBadgesRaw)
            : tags.badges;

        // Parse reply info
        let reply: ReplyInfo | undefined;
        if (tags['reply-parent-msg-id'] && config.showReplies) {
            reply = {
                parentMsgId: tags['reply-parent-msg-id'],
                parentUserId: tags['reply-parent-user-id'] || '',
                parentUserLogin: tags['reply-parent-user-login'] || '',
                parentDisplayName: tags['reply-parent-display-name'] || '',
                parentMsgBody: tags['reply-parent-msg-body'] || '',
            };
            messageType = 'reply';
        }

        // Get bits amount
        const bits = tags.bits ? parseInt(tags.bits as unknown as string) : undefined;
        if (bits) messageType = 'cheer';

        const messageId = tags.id || crypto.randomUUID();
        const badges = await getUserBadges(badgeSource, userId);
        const parsedContent = parseMessageContent(message, tags.emotes, bits);

        const newMessage: ChatMessage = {
            id: messageId,
            username,
            displayName: tags['display-name'] || username,
            userId,
            content: message,
            parsedContent,
            color: tags.color || generateColor(username),
            timestamp: Date.now(),
            type: messageType,
            isAction,
            isFirstMessage: isFirstMsg,
            isHighlighted: messageType === 'highlighted',
            badges,
            isShared,
            sourceRoomId: isShared ? sourceRoomId : undefined,
            reply,
            bits,
        };

        // Add message
        setMessages(prev => {
            const updated = [...prev, newMessage];
            if (updated.length > config.maxMessages) {
                return updated.slice(-config.maxMessages);
            }
            return updated;
        });

        // Async enhancements
        if (config.showPronouns) {
            getUserPronouns(username).then(pronouns => {
                if (!keepAlive || !pronouns) return;
                setMessages(prev => prev.map(m =>
                    m.id === messageId ? { ...m, pronouns } : m
                ));
            });
        }

        if (config.showNamePaints) {
            get7TVUserPaint(userId).then(paint => {
                if (!keepAlive || !paint) return;
                const { style } = getNamePaintStyles(paint);
                setMessages(prev => prev.map(m =>
                    m.id === messageId ? { ...m, paint: style } : m
                ));
            });
        }

        // Fetch source channel name for shared chat
        if (isShared && sourceRoomId && config.showSharedChat) {
            getChannelByRoomId(sourceRoomId).then(channelInfo => {
                if (!keepAlive || !channelInfo) return;
                setMessages(prev => prev.map(m =>
                    m.id === messageId
                        ? {
                            ...m,
                            sourceChannelName: channelInfo.displayName,
                            sourceLogo: channelInfo.logo
                        }
                        : m
                ));
            });
        }

        // Fetch third-party badges
        Promise.all([
            fetch7TVUserBadges(userId),
            fetchFFZUserBadges(userId)
        ]).then(([sevenTVBadges, ffzBadges]) => {
            if (!keepAlive) return;
            const extraBadges = [...sevenTVBadges, ...ffzBadges];
            if (extraBadges.length === 0) return;

            setMessages(prev => prev.map(m =>
                m.id === messageId
                    ? { ...m, badges: [...m.badges, ...extraBadges] }
                    : m
            ));
        });
    };

    /**
     * Generate consistent color for username
     */
    const generateColor = (username: string): string => {
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash % 360);
        return `hsl(${hue}, 70%, 60%)`;
    };

    /**
     * Format timestamp
     */
    const formatTime = (timestamp: number): string => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    /**
     * Get message container class based on type
     */
    const getMessageClass = (msg: ChatMessage): string => {
        const classes = ['chat-message'];

        if (msg.type === 'action') classes.push('chat-message--action');
        if (msg.type === 'sub' || msg.type === 'resub') classes.push('chat-message--sub');
        if (msg.type === 'subgift' || msg.type === 'submysterygift') classes.push('chat-message--gift');
        if (msg.type === 'raid') classes.push('chat-message--raid');
        if (msg.type === 'announcement') classes.push('chat-message--announcement');
        if (msg.isHighlighted) classes.push('chat-message--highlighted');
        if (msg.isFirstMessage && config.showFirstMessage) classes.push('chat-message--first');

        return classes.join(' ');
    };

    onMount(async () => {
        const channel = params.channel;
        if (!channel) return;

        console.log(`🎮 Kroma - Connecting to #${channel}`);

        // Pre-cache channel info
        cacheChannelByUsername(channel);

        // Fetch channel ID
        try {
            const res = await fetch(`https://api.ivr.fi/v2/twitch/user?login=${channel}`);
            if (res.ok) {
                const data = await res.json();
                const id = data[0]?.id;
                if (id) {
                    setChannelId(id);
                    console.log(`📺 Channel ID: ${id}`);
                }
            }
        } catch (e) {
            console.error('Failed to get channel ID:', e);
        }

        const currentChannelId = channelId();

        // Fetch all resources in parallel
        const [
            _globalBadges,
            _channelBadges,
            _paints,
            _7tvBadges,
            g7tv, c7tv,
            gBttv, cBttv,
            gFfz, cFfz
        ] = await Promise.all([
            fetchGlobalTwitchBadges(),
            currentChannelId ? fetchChannelTwitchBadges(currentChannelId) : Promise.resolve(),
            preloadPaints(), // Preload 7TV paints
            preload7TVBadges(), // Preload 7TV badges
            fetch7TVGlobalEmotes(),
            currentChannelId ? fetch7TVChannelEmotes(currentChannelId) : Promise.resolve([]),
            fetchBTTVGlobalEmotes(),
            currentChannelId ? fetchBTTVChannelEmotes(currentChannelId) : Promise.resolve([]),
            fetchFFZGlobalEmotes(),
            fetchFFZChannelEmotes(channel)
        ]);

        global7TV = g7tv;
        channel7TV = c7tv;
        globalBTTV = gBttv;
        channelBTTV = cBttv;
        globalFFZ = gFfz;
        channelFFZ = cFfz;

        console.log(`✨ Loaded emotes - 7TV: ${global7TV.length + channel7TV.length}, BTTV: ${globalBTTV.length + channelBTTV.length}, FFZ: ${globalFFZ.length + channelFFZ.length}`);


        if (channel) {
            // Connect to Twitch
            client = new tmi.Client({
                channels: [channel],
                connection: {
                    secure: true,
                    reconnect: true,
                },
            });

            client.on("message", handleMessage);

            client.on("connected", () => {
                setIsConnected(true);
                console.log(`✅ Connected to #${channel}`);
            });

            client.on("disconnected", () => {
                setIsConnected(false);
                console.log(`❌ Disconnected from #${channel}`);
            });

            try {
                await client.connect();
            } catch (err) {
                console.error("Failed to connect to Twitch:", err);
            }
        }


    });

    onCleanup(() => {
        keepAlive = false;
        if (client) {
            client.disconnect().catch(console.error);
        }
    });

    return (
        <>
            <MySiteTitle>#{params.channel}</MySiteTitle>

            {/* Chat Container */}
            <div
                class="fixed inset-0 pointer-events-none p-4 flex items-end overflow-hidden"
                style={{
                    "font-size": `${config.fontSize}px`,
                    "font-family": `"${config.fontFamily}", "Segoe UI", "Inter", sans-serif`,
                    "--emote-scale": config.emoteScale,
                    "--fade-delay": `${config.fadeOutDelay / 1000}s`
                }}
            >
                <ul
                    ref={messageContainer}
                    class="chat-container w-full"
                >
                    <For each={[...messages()].reverse()}>
                        {(msg, index) => (
                            <li
                                class={getMessageClass(msg)}
                                data-fading={config.fadeOutMessages ? "true" : "false"}
                                style={{
                                    "animation-delay": `${index() * 20}ms, var(--fade-delay)`,
                                    ...(msg.isAction ? { color: msg.color } : {})
                                }}
                            >
                                {/* Reply Context */}
                                <Show when={msg.reply && config.showReplies}>
                                    <div class="reply-context">
                                        <svg class="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                                        </svg>
                                        <span class="reply-context__username">@{msg.reply!.parentDisplayName}</span>
                                        <span class="reply-context__body">{msg.reply!.parentMsgBody}</span>
                                    </div>
                                </Show>

                                {/* First Message Indicator */}
                                <Show when={msg.isFirstMessage && config.showFirstMessage}>
                                    <div class="first-message-indicator mb-1 inline-block">
                                        First Message
                                    </div>
                                </Show>

                                <div class="flex items-start gap-2 flex-wrap leading-snug pointer-events-auto">
                                    {/* Timestamp */}
                                    <Show when={config.showTimestamps}>
                                        <span class="timestamp self-center">
                                            {formatTime(msg.timestamp)}
                                        </span>
                                    </Show>

                                    {/* Shared Chat Badge */}
                                    <Show when={msg.isShared && config.showSharedChat}>
                                        <div class="mr-2 flex items-center h-[20px] self-center">
                                            <Show when={msg.sourceLogo}>
                                                <img
                                                    src={msg.sourceLogo}
                                                    alt={msg.sourceChannelName || "Source"}
                                                    class="w-5 h-5 rounded-full ring-1 ring-white/30"
                                                    title={msg.sourceChannelName ? `From ${msg.sourceChannelName}` : "Shared Message"}
                                                />
                                            </Show>
                                        </div>
                                    </Show>

                                    {/* Badges */}
                                    <Show when={config.showBadges && msg.badges.length > 0}>
                                        <div class="flex gap-0.5 self-center shrink-0 select-none">
                                            <For each={msg.badges}>
                                                {(badge) => (
                                                    <img
                                                        src={badge.url}
                                                        alt={badge.title}
                                                        title={badge.title}
                                                        class="badge"
                                                        loading="lazy"
                                                    />
                                                )}
                                            </For>
                                        </div>
                                    </Show>

                                    {/* Username Group */}
                                    <div class="flex items-baseline shrink-0">
                                        {/* Pronouns */}
                                        <Show when={msg.pronouns && config.showPronouns}>
                                            <span class="pronouns-badge mr-1.5">
                                                {msg.pronouns}
                                            </span>
                                        </Show>

                                        <span
                                            class={`username ${msg.paint ? 'username--painted' : ''}`}
                                            style={{
                                                color: msg.paint ? undefined : msg.color,
                                                ...(msg.paint || {})
                                            }}
                                        >
                                            {msg.displayName}
                                        </span>

                                        <Show when={!msg.isAction}>
                                            <span class="separator">:</span>
                                        </Show>
                                    </div>

                                    {/* Bits/Cheer Badge */}
                                    <Show when={msg.bits}>
                                        <span
                                            class="cheer-amount animate-pop-in"
                                            style={{ color: getCheerTierColor(msg.bits!) }}
                                        >
                                            <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" />
                                            </svg>
                                            {msg.bits}
                                        </span>
                                    </Show>

                                    {/* Message Content */}
                                    <span
                                        class="text-white break-words"
                                        style={msg.isAction ? { color: msg.color } : undefined}
                                    >
                                        <For each={msg.parsedContent}>
                                            {(part) => (
                                                <>
                                                    {typeof part === 'string' ? (
                                                        <span>{part}</span>
                                                    ) : part.type === 'emote' ? (
                                                        <img
                                                            src={part.url}
                                                            alt={part.name}
                                                            title={part.name}
                                                            class={`emote ${part.isZeroWidth ? 'emote--zero-width' : ''}`}
                                                            loading="lazy"
                                                        />
                                                    ) : null}
                                                </>
                                            )}
                                        </For>
                                    </span>
                                </div>
                            </li>
                        )}
                    </For>
                </ul>
            </div>

            {/* Connection Status (hidden in OBS) */}
            <Show when={!isConnected()}>
                <div class="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                    <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(168,85,247,0.6)]">
                        <span class="text-white text-4xl font-extrabold font-sans">K</span>
                    </div>
                </div>
            </Show>
        </>
    );
}

import { useParams, useSearchParams } from "solid-start";
import { createSignal, onMount, onCleanup, For, Show, createEffect, createMemo } from "solid-js";
import tmi from "tmi.js";
import MySiteTitle from "~/components/MySiteTitle";

// Utils
import { getUserPronounInfo } from "~/utils/pronouns";
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
type ChatPlatform = 'twitch' | 'kick' | 'both';

interface ChatConfig {
    platform: ChatPlatform;
    showPlatformBadge: boolean;
    showPronouns: boolean;
    pridePronouns: boolean;  // Use rainbow pride gradient for pronoun badges
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
    showRoomState: boolean;
}

const DEFAULT_CONFIG: ChatConfig = {
    platform: 'twitch',
    showPlatformBadge: true,
    showPronouns: true,
    pridePronouns: false,  // Default to standard purple badges
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
    showRoomState: false,
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
    const [twitchConnected, setTwitchConnected] = createSignal(false);
    const [kickConnected, setKickConnected] = createSignal(false);
    const [channelId, setChannelId] = createSignal<string | null>(null);

    // Room State (slow mode, emote-only, etc.)
    const [roomState, setRoomState] = createSignal<{
        slowMode: number;        // 0 = off, >0 = seconds between messages
        emoteOnly: boolean;      // Emote-only mode
        followersOnly: number;   // -1 = off, 0 = all followers, >0 = minutes required
        subsOnly: boolean;       // Subscribers-only mode
        r9k: boolean;            // R9K/unique mode
    }>({
        slowMode: 0,
        emoteOnly: false,
        followersOnly: -1,
        subsOnly: false,
        r9k: false
    });

    // Deleted message IDs (for mod actions)
    const [deletedMessages, setDeletedMessages] = createSignal<Set<string>>(new Set());

    // Refs
    let client: tmi.Client | null = null;
    let kickSocket: WebSocket | null = null;
    let kickReconnectTimer: number | undefined;
    let kickReconnectAttempts = 0;
    let kickSubscriberBadges: Array<{ months: number; url: string }> = [];
    let kickFollowerBadges: Array<{ months: number; url: string }> = [];
    let kickChannelUserId: string | null = null;
    let keepAlive = true;
    let messageContainer: HTMLUListElement | undefined;

    // Emote storage
    let global7TV: Emote[] = [];
    let channel7TV: Emote[] = [];
    let channel7TVKick: Emote[] = [];
    let globalBTTV: Emote[] = [];
    let channelBTTV: Emote[] = [];
    let globalFFZ: Emote[] = [];
    let channelFFZ: Emote[] = [];

    // Parse config from URL params reactively
    const config = createMemo<ChatConfig>(() => ({
        ...DEFAULT_CONFIG,
        platform: searchParams.platform === 'kick' ? 'kick' : searchParams.platform === 'both' ? 'both' : 'twitch',
        showPlatformBadge: searchParams.platformBadge !== 'false',
        showPronouns: searchParams.pronouns !== 'false' && searchParams.platform !== 'kick',
        pridePronouns: searchParams.pridePronouns === 'true',
        showBadges: searchParams.badges !== 'false',
        showEmotes: searchParams.emotes !== 'false',
        showTimestamps: searchParams.timestamps === 'true',
        showSharedChat: searchParams.shared !== 'false' && searchParams.platform !== 'kick',
        showNamePaints: searchParams.paints !== 'false',
        hideCommands: searchParams.hideCommands === 'true',
        hideBots: searchParams.hideBots === 'true',
        showReplies: searchParams.replies !== 'false' && searchParams.platform !== 'kick',
        maxMessages: parseInt(searchParams.maxMessages || '50') || 50,
        fontSize: parseInt(searchParams.fontSize || '16') || 16,
        fontFamily: searchParams.font || 'Segoe UI',
        fadeOutMessages: searchParams.fadeOut === 'true',
        fadeOutDelay: parseInt(searchParams.fadeDelay || '30000') || 30000,
        emoteScale: parseFloat(searchParams.emoteScale || '1') || 1,
        blockedUsers: searchParams.blocked ? searchParams.blocked.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : [],
        customBots: searchParams.bots ? searchParams.bots.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : [],
        showRoomState: searchParams.roomState === 'true' && searchParams.platform !== 'kick',
    }));

    const isConnected = createMemo(() => {
        const platform = config().platform;
        if (platform === 'both') return twitchConnected() || kickConnected();
        if (platform === 'kick') return kickConnected();
        return twitchConnected();
    });

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
     * Add a system/event message (subs, raids, etc.)
     */
    const addSystemMessage = (msg: ChatMessage) => {
        setMessages(prev => {
            const updated = [...prev, msg];
            if (updated.length > config().maxMessages) {
                return updated.slice(-config().maxMessages);
            }
            return updated;
        });
    };

    /**
     * Find emote in all providers
     */
    const findEmote = (code: string, platform: 'twitch' | 'kick' = 'twitch'): Emote | null => {
        const channelEmotes = platform === 'kick' ? channel7TVKick : channel7TV;
        if (platform === 'kick') {
            return channelEmotes.find(e => e.code === code) ||
                global7TV.find(e => e.code === code) ||
                null;
        }

        // Priority: Channel > Global, 7TV > BTTV > FFZ
        return channelEmotes.find(e => e.code === code) ||
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

        if (twitchEmotes && config().showEmotes) {
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
                if (config().showEmotes) {
                    const emote = findEmote(trimmed, 'twitch');
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

    const getKickEmoteUrl = (emote: any): string | undefined => {
        const directUrl = emote?.url || emote?.image_url || emote?.image;
        if (typeof directUrl === "string" && directUrl.length) return directUrl;

        const images = emote?.images || emote?.image;
        if (images) {
            const candidates = [
                images.fullsize,
                images.full,
                images.original,
                images.large,
                images.medium,
                images.small,
                images?.url,
            ];
            for (const candidate of candidates) {
                if (typeof candidate === "string" && candidate.length) return candidate;
            }
        }

        if (emote?.id) {
            return `https://files.kick.com/emotes/${emote.id}/fullsize`;
        }

        return undefined;
    };

    const parseKickMessageContent = (text: string, emotes?: any[]): ParsedPart[] => {
        if (Array.isArray(emotes) && emotes.length > 0) {
            const positioned = emotes
                .map((emote) => {
                    const start = emote?.start ?? emote?.start_index ?? emote?.startIndex ?? emote?.positions?.[0];
                    const end = emote?.end ?? emote?.end_index ?? emote?.endIndex ?? emote?.positions?.[1];
                    if (typeof start !== "number" || typeof end !== "number") return null;
                    const url = getKickEmoteUrl(emote);
                    if (!url) return null;
                    return {
                        start,
                        end,
                        url,
                        name: String(emote?.name || emote?.code || emote?.id || "emote")
                    };
                })
                .filter(Boolean) as Array<{ start: number; end: number; url: string; name: string }>;

            if (positioned.length > 0) {
                positioned.sort((a, b) => a.start - b.start);
                const parts: ParsedPart[] = [];
                let cursor = 0;
                for (const emote of positioned) {
                    if (emote.start > cursor) {
                        parts.push(text.slice(cursor, emote.start));
                    }
                    parts.push({
                        type: "emote",
                        url: emote.url,
                        name: emote.name,
                        provider: "kick"
                    });
                    cursor = emote.end + 1;
                }
                if (cursor < text.length) {
                    parts.push(text.slice(cursor));
                }
                return parts.filter(p => p !== "");
            }
        }

        const parts: ParsedPart[] = [];
        const emoteRegex = /\[emote:(\d+):([^\]]+)\]/g;
        let lastIndex = 0;
        let match: RegExpExecArray | null = null;

        while ((match = emoteRegex.exec(text)) !== null) {
            const [full, id, name] = match;
            if (match.index > lastIndex) {
                parts.push(text.slice(lastIndex, match.index));
            }
            parts.push({
                type: "emote",
                url: `https://files.kick.com/emotes/${id}/fullsize`,
                name,
                provider: "kick"
            });
            lastIndex = match.index + full.length;
        }

        if (lastIndex < text.length) {
            parts.push(text.slice(lastIndex));
        }

        const finalParts: ParsedPart[] = [];
        const processTextChunk = (chunk: string) => {
            if (!chunk) return;
            const words = chunk.split(/(\s+)/);
            for (const word of words) {
                const trimmed = word.trim();
                if (!trimmed) {
                    finalParts.push(word);
                    continue;
                }
                if (config().showEmotes) {
                    const emote = findEmote(trimmed, 'kick');
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
                finalParts.push(word);
            }
        };

        for (const part of parts) {
            if (typeof part === 'string') {
                processTextChunk(part);
            } else {
                finalParts.push(part);
            }
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
        if (twitchBadges && config().showBadges) {
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
        if (config().hideBots && KNOWN_BOTS.has(username.toLowerCase())) {
            return;
        }

        // Filter custom blocked users
        if (config().blockedUsers.includes(username.toLowerCase())) {
            return;
        }

        // Filter custom bots
        if (config().customBots.includes(username.toLowerCase())) {
            return;
        }

        // Filter commands
        if (config().hideCommands && message.startsWith('!')) {
            return;
        }

        // Determine message type
        let messageType: MessageType = 'chat';
        const isAction = tags['message-type'] === 'action';
        const isFirstMsg = tags['first-msg'] === true || tags['first-msg'] === '1' || tags['first-msg'] === 1;

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
        if (tags['reply-parent-msg-id'] && config().showReplies) {
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
            platform: 'twitch',
            isShared,
            sourceRoomId: isShared ? sourceRoomId : undefined,
            reply,
            bits,
        };

        // Add message
        setMessages(prev => {
            const updated = [...prev, newMessage];
            if (updated.length > config().maxMessages) {
                return updated.slice(-config().maxMessages);
            }
            return updated;
        });

        // Async enhancements
        if (config().showPronouns) {
            getUserPronounInfo(username).then(pronounInfo => {
                if (!keepAlive || !pronounInfo) return;
                setMessages(prev => prev.map(m =>
                    m.id === messageId ? {
                        ...m,
                        pronouns: pronounInfo.display,
                        pronounColor: pronounInfo.color,
                        pronounIsGradient: pronounInfo.isGradient
                    } : m
                ));
            });
        }

        if (config().showNamePaints) {
            get7TVUserPaint(userId, 'twitch').then(paint => {
                if (!keepAlive || !paint) return;
                const { style } = getNamePaintStyles(paint);
                setMessages(prev => prev.map(m =>
                    m.id === messageId ? { ...m, paint: style } : m
                ));
            });
        }

        // Fetch source channel name for shared chat
        if (isShared && sourceRoomId && config().showSharedChat) {
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
                fetch7TVUserBadges(userId, 'twitch'),
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

    const KICK_PUSHER_URL = "wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.4.0-rc2&flash=false";

    const fetchKickChannelData = async (channel: string) => {
        try {
            const res = await fetch(`/api/kick?channel=${encodeURIComponent(channel)}`);
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            console.error("Failed to fetch Kick channel info:", e);
            return null;
        }
    };

    const applyKickBadgesFromChannel = (channelData: any) => {
        const subs = Array.isArray(channelData?.subscriber_badges) ? channelData.subscriber_badges : [];
        const followers = Array.isArray(channelData?.follower_badges) ? channelData.follower_badges : [];

        kickSubscriberBadges = subs
            .map((badge: any) => ({
                months: typeof badge?.months === "number" ? badge.months : Number(badge?.months),
                url: badge?.badge_image?.src || badge?.badge_image?.url
            }))
            .filter((badge: any) => Number.isFinite(badge.months) && typeof badge.url === "string");

        kickFollowerBadges = followers
            .map((badge: any) => ({
                months: typeof badge?.months === "number" ? badge.months : Number(badge?.months),
                url: badge?.badge_image?.src || badge?.badge_image?.url
            }))
            .filter((badge: any) => Number.isFinite(badge.months) && typeof badge.url === "string");
    };


    const parseKickPayload = (rawData: unknown) => {
        if (!rawData) return null;
        if (typeof rawData === "string") {
            try {
                return JSON.parse(rawData);
            } catch (e) {
                return null;
            }
        }
        return rawData;
    };

    const KICK_GLOBAL_BADGES: Record<string, string> = {
        trainwreckstv: "https://www.kickdatabase.com/kickBadges/trainwreckstv.svg",
        staff: "https://www.kickdatabase.com/kickBadges/staff.svg",
        verified: "https://www.kickdatabase.com/kickBadges/verified.svg",
        sidekick: "https://www.kickdatabase.com/kickBadges/sidekick.svg",
        broadcaster: "https://www.kickdatabase.com/kickBadges/broadcaster.svg",
        moderator: "https://www.kickdatabase.com/kickBadges/moderator.svg",
        vip: "https://www.kickdatabase.com/kickBadges/vip.svg",
        og: "https://www.kickdatabase.com/kickBadges/og.svg",
        founder: "https://www.kickdatabase.com/kickBadges/founder.svg",
        subgifter: "https://www.kickdatabase.com/kickBadges/subGifter.svg",
        subgifter25: "https://www.kickdatabase.com/kickBadges/subGifter25.svg",
        subgifter50: "https://www.kickdatabase.com/kickBadges/subGifter50.svg",
        subgifter100: "https://www.kickdatabase.com/kickBadges/subGifter100.svg",
        subgifter200: "https://www.kickdatabase.com/kickBadges/subGifter200.svg",
    };

    const normalizeKickBadgeType = (value: string) => value
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/_/g, "");

    const getKickGlobalBadgeUrl = (type: string, count?: number) => {
        const normalized = normalizeKickBadgeType(type);
        if (normalized === "subgifter" || normalized === "subgifterbadge") {
            if (typeof count === "number") {
                if (count >= 200) return KICK_GLOBAL_BADGES.subgifter200;
                if (count >= 100) return KICK_GLOBAL_BADGES.subgifter100;
                if (count >= 50) return KICK_GLOBAL_BADGES.subgifter50;
                if (count >= 25) return KICK_GLOBAL_BADGES.subgifter25;
            }
            return KICK_GLOBAL_BADGES.subgifter;
        }

        return KICK_GLOBAL_BADGES[normalized];
    };

    const PLATFORM_LOGOS: Record<"twitch" | "kick", string> = {
        twitch: "https://cdn.brandfetch.io/idIwZCwD2f/theme/dark/symbol.svg?c=1bxid64Mup7aczewSAYMX&t=1668070397594",
        kick: "data:image/svg+xml;utf8,%3Csvg%20viewBox%3D%220%200%20512%20512%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20stroke-linejoin%3D%22round%22%20stroke-miterlimit%3D%222%22%3E%3Cpath%20d%3D%22M37%20.036h164.448v113.621h54.71v-56.82h54.731V.036h164.448v170.777h-54.73v56.82h-54.711v56.8h54.71v56.82h54.73V512.03H310.89v-56.82h-54.73v-56.8h-54.711v113.62H37V.036z%22%20fill%3D%22%2353fc18%22/%3E%3C/svg%3E",
    };

    const handleKickMessage = (payload: any) => {
        if (!payload) return;

        const fallbackId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `kick-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const messageId = payload.message_id || payload?.message?.id || payload?.message?.message_id || fallbackId;
        const content = payload.content || payload?.message?.message || payload?.message?.content || "";
        const sender = payload.sender || payload?.user || payload?.message?.user || {};
        const identity = sender.identity || {};
        const rawBadges = Array.isArray(identity.badges) ? identity.badges : [];
        const kickBadgeImages: Badge[] = [];
        const kickBadges = rawBadges
            .filter((badge: any) => badge?.active !== false)
            .map((badge: any) => {
                const badgeType = String(badge.type || badge.name || badge.key || "badge");
                const imageUrl = badge?.image_url || badge?.image || badge?.icon || badge?.url || badge?.badge_image;
                const badgeCount = typeof badge.count === "number" ? badge.count : undefined;
                const fallbackUrl = getKickGlobalBadgeUrl(badgeType, badgeCount);
                if (typeof imageUrl === "string" && imageUrl.length) {
                    kickBadgeImages.push({
                        id: `kick-${badgeType}`,
                        title: badgeType.replace(/_/g, " "),
                        url: imageUrl,
                        provider: "kick"
                    });
                } else if (fallbackUrl) {
                    kickBadgeImages.push({
                        id: `kick-${badgeType}`,
                        title: badgeType.replace(/_/g, " "),
                        url: fallbackUrl,
                        provider: "kick"
                    });
                }
                return {
                    type: badgeType,
                    text: badge.text ? String(badge.text) : undefined,
                    count: badgeCount,
                    active: badge.active === undefined ? undefined : Boolean(badge.active)
                };
            });
        const subBadge = rawBadges.find((badge: any) => String(badge?.type || "").toLowerCase().includes("sub"));
        const subMonthsRaw = subBadge?.count ?? subBadge?.months ?? subBadge?.text ?? sender?.months_subscribed ?? payload?.months_subscribed;
        const subMonths = typeof subMonthsRaw === "number" ? subMonthsRaw : Number(subMonthsRaw);
        if (Number.isFinite(subMonths) && kickSubscriberBadges.length > 0) {
            const sorted = [...kickSubscriberBadges].sort((a, b) => a.months - b.months);
            const match = sorted.reduce((acc, badge) => (badge.months <= subMonths ? badge : acc), sorted[0]);
            if (match?.url) {
                kickBadgeImages.unshift({
                    id: `kick-subscriber-${match.months}`,
                    title: `Subscriber (${match.months}m)`,
                    url: match.url,
                    provider: "kick"
                });
            }
        }

        const followerBadge = rawBadges.find((badge: any) => String(badge?.type || "").toLowerCase().includes("follower"));
        const followerMonthsRaw = followerBadge?.count ?? followerBadge?.months ?? followerBadge?.text ?? sender?.months_following ?? payload?.months_following;
        const followerMonths = typeof followerMonthsRaw === "number" ? followerMonthsRaw : Number(followerMonthsRaw);
        if (Number.isFinite(followerMonths) && kickFollowerBadges.length > 0) {
            const sorted = [...kickFollowerBadges].sort((a, b) => a.months - b.months);
            const match = sorted.reduce((acc, badge) => (badge.months <= followerMonths ? badge : acc), sorted[0]);
            if (match?.url) {
                kickBadgeImages.unshift({
                    id: `kick-follower-${match.months}`,
                    title: `Follower (${match.months}m)`,
                    url: match.url,
                    provider: "kick"
                });
            }
        }
        const username = sender.username || sender.slug || sender.name || "unknown";
        const userId = sender.user_id || sender.id || "";
        const rawCreatedAt = payload.created_at ?? payload?.message?.created_at;
        const timestamp = rawCreatedAt
            ? (() => {
                const numeric = Number(rawCreatedAt);
                if (!Number.isNaN(numeric)) {
                    return numeric > 10_000_000_000 ? numeric : numeric * 1000;
                }
                const parsed = new Date(String(rawCreatedAt)).getTime();
                return Number.isNaN(parsed) ? Date.now() : parsed;
            })()
            : Date.now();

        if (!content) return;

        // Filter bots (Kick uses usernames too)
        if (config().hideBots && KNOWN_BOTS.has(String(username).toLowerCase())) {
            return;
        }

        // Filter custom blocked users
        if (config().blockedUsers.includes(String(username).toLowerCase())) {
            return;
        }

        // Filter custom bots
        if (config().customBots.includes(String(username).toLowerCase())) {
            return;
        }

        // Filter commands
        if (config().hideCommands && content.startsWith('!')) {
            return;
        }

        const parsedContent = parseKickMessageContent(String(content), payload?.emotes || payload?.message?.emotes);
        const nameColor = typeof identity?.color === "string"
            ? identity.color
            : typeof identity?.username_color === "string"
                ? identity.username_color
                : generateColor(String(username));
        const newMessage: ChatMessage = {
            id: String(messageId),
            username: String(username),
            displayName: String(username),
            userId: String(userId),
            content: String(content),
            parsedContent,
            color: nameColor,
            timestamp,
            type: 'chat',
            isAction: false,
            isFirstMessage: false,
            isHighlighted: false,
            badges: kickBadgeImages,
            kickBadges: kickBadges.length ? kickBadges : undefined,
            platform: 'kick',
            isShared: false
        };

        setMessages(prev => {
            const updated = [...prev, newMessage];
            if (updated.length > config().maxMessages) {
                return updated.slice(-config().maxMessages);
            }
            return updated;
        });

        if (config().showPronouns) {
            getUserPronounInfo(String(username)).then(pronounInfo => {
                if (!keepAlive || !pronounInfo) return;
                setMessages(prev => prev.map(m =>
                    m.id === String(messageId) ? {
                        ...m,
                        pronouns: pronounInfo.display,
                        pronounColor: pronounInfo.color,
                        pronounIsGradient: pronounInfo.isGradient
                    } : m
                ));
            });
        }

        if (config().showNamePaints) {
            get7TVUserPaint(String(userId), 'kick').then(paint => {
                if (!keepAlive || !paint) return;
                const { style } = getNamePaintStyles(paint);
                setMessages(prev => prev.map(m =>
                    m.id === String(messageId) ? { ...m, paint: style } : m
                ));
            });
        }

        if (config().showBadges) {
            Promise.all([
                fetch7TVUserBadges(String(userId), 'kick')
            ]).then(([sevenTVBadges]) => {
                if (!keepAlive || sevenTVBadges.length === 0) return;
                setMessages(prev => prev.map(m =>
                    m.id === String(messageId)
                        ? { ...m, badges: [...m.badges, ...sevenTVBadges] }
                        : m
                ));
            });
        }
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

        // Message type styling
        if (msg.type === 'action') classes.push('chat-message--action');
        if (msg.type === 'sub') classes.push('message-sub');
        if (msg.type === 'resub') classes.push('message-resub');
        if (msg.type === 'subgift') classes.push('message-subgift');
        if (msg.type === 'submysterygift') classes.push('message-submysterygift');
        if (msg.type === 'raid') classes.push('message-raid');
        if (msg.type === 'announcement') classes.push('chat-message--announcement');
        if (msg.type === 'system') classes.push('message-modaction');
        if (msg.isHighlighted) classes.push('chat-message--highlighted');
        if (msg.isFirstMessage && config().showFirstMessage) classes.push('chat-message--first');

        // Check if message was deleted
        if (deletedMessages().has(msg.id)) classes.push('message-deleted');

        return classes.join(' ');
    };

    const connectKick = async (channel: string) => {
        console.log(`🟢 Kroma - Connecting to Kick #${channel}`);

        const kickData = await fetchKickChannelData(channel);
        const chatroomId = kickData?.chatroomId ?? kickData?.channel?.chatroom?.id ?? kickData?.chatroom?.id ?? null;
        if (!chatroomId) {
            console.error("Failed to resolve Kick chatroom ID.");
            return;
        }

        applyKickBadgesFromChannel(kickData?.channel);
        const kickUserId = kickData?.channel?.id ?? kickData?.channel?.user_id ?? kickData?.channel?.user?.id ?? null;
        if (kickUserId) {
            kickChannelUserId = String(kickUserId);
        }

        // 7TV assets for Kick (global + channel)
        const [g7tv, c7tv, _paints, _7tvBadges] = await Promise.all([
            fetch7TVGlobalEmotes(),
            kickChannelUserId ? fetch7TVChannelEmotes(kickChannelUserId, 'kick') : Promise.resolve([]),
            preloadPaints(),
            preload7TVBadges()
        ]);

        global7TV = g7tv;
        channel7TVKick = c7tv;

        const connect = () => {
            if (!keepAlive) return;

            kickSocket?.close();
            kickSocket = new WebSocket(KICK_PUSHER_URL);

            kickSocket.onopen = () => {
                kickReconnectAttempts = 0;
                const subscribeMsg = {
                    event: "pusher:subscribe",
                    data: {
                        auth: "",
                        channel: `chatrooms.${chatroomId}.v2`
                    }
                };
                kickSocket?.send(JSON.stringify(subscribeMsg));
            };

            kickSocket.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data);
                    const eventName = payload?.event;

                    if (eventName === "pusher:connection_established") {
                        setKickConnected(true);
                        return;
                    }

                    if (eventName === "pusher:error") {
                        setKickConnected(false);
                        console.error("Kick Pusher error:", payload?.data);
                        return;
                    }

                    if (eventName === "App\\Events\\ChatMessageEvent" || eventName === "App\\Events\\ChatMessageSentEvent") {
                        const data = parseKickPayload(payload.data);
                        handleKickMessage(data);
                    }
                } catch (e) {
                    console.error("Failed to parse Kick message:", e);
                }
            };

            kickSocket.onclose = () => {
                setKickConnected(false);
                if (!keepAlive) return;
                const delay = Math.min(10000, 1000 * Math.pow(2, kickReconnectAttempts));
                kickReconnectAttempts += 1;
                kickReconnectTimer = window.setTimeout(connect, delay);
            };

            kickSocket.onerror = (error) => {
                console.error("Kick WebSocket error:", error);
            };
        };

        connect();
    };

    onMount(async () => {
        const channel = params.channel;
        if (!channel) return;

        const platform = config().platform;

        if (platform === 'kick' || platform === 'both') {
            await connectKick(channel);
        }

        if (platform === 'twitch' || platform === 'both') {
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
            console.log(`📺 Using Channel ID: ${currentChannelId}`);

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

            // Subscription event
            client.on("subscription", (channel, username, method, message, userstate) => {
                const subMessage: ChatMessage = {
                    id: `sub-${Date.now()}-${username}`,
                    username: username,
                    displayName: userstate['display-name'] || username,
                    userId: userstate['user-id'] || '',
                    content: message || `${userstate['display-name'] || username} subscribed!`,
                    parsedContent: [message || `subscribed with ${method.prime ? 'Twitch Prime' : `Tier ${method.plan?.charAt(0) || '1'}`}!`],
                    color: userstate.color || '#9147ff',
                    timestamp: Date.now(),
                    type: 'sub',
                    isAction: false,
                    isFirstMessage: false,
                    isHighlighted: false,
                    badges: [],
                    platform: 'twitch',
                    isShared: false,
                    subInfo: {
                        months: 1,
                        tier: method.prime ? 'Prime' : (method.plan as '1000' | '2000' | '3000') || '1000',
                        isPrime: method.prime || false
                    }
                };
                addSystemMessage(subMessage);
            });

            // Resub event
            client.on("resub", (channel, username, months, message, userstate, methods) => {
                const subMessage: ChatMessage = {
                    id: `resub-${Date.now()}-${username}`,
                    username: username,
                    displayName: userstate['display-name'] || username,
                    userId: userstate['user-id'] || '',
                    content: message || `${userstate['display-name'] || username} resubscribed for ${months} months!`,
                    parsedContent: [message || `resubscribed for ${months} months!`],
                    color: userstate.color || '#9147ff',
                    timestamp: Date.now(),
                    type: 'resub',
                    isAction: false,
                    isFirstMessage: false,
                    isHighlighted: false,
                    badges: [],
                    platform: 'twitch',
                    isShared: false,
                    subInfo: {
                        months: months,
                        tier: methods.prime ? 'Prime' : (methods.plan as '1000' | '2000' | '3000') || '1000',
                        isPrime: methods.prime || false
                    }
                };
                addSystemMessage(subMessage);
            });

            // Gift sub event
            client.on("subgift", (channel, username, streakMonths, recipient, methods, userstate) => {
                const giftMessage: ChatMessage = {
                    id: `gift-${Date.now()}-${username}`,
                    username: username,
                    displayName: userstate['display-name'] || username,
                    userId: userstate['user-id'] || '',
                    content: `${userstate['display-name'] || username} gifted a sub to ${recipient}!`,
                    parsedContent: [`gifted a Tier ${methods.plan?.charAt(0) || '1'} sub to ${recipient}!`],
                    color: userstate.color || '#00c87f',
                    timestamp: Date.now(),
                    type: 'subgift',
                    isAction: false,
                    isFirstMessage: false,
                    isHighlighted: false,
                    badges: [],
                    platform: 'twitch',
                    isShared: false,
                    subInfo: {
                        months: 1,
                        tier: (methods.plan as '1000' | '2000' | '3000') || '1000',
                        isPrime: false,
                        recipientDisplayName: recipient
                    }
                };
                addSystemMessage(giftMessage);
            });

            // Mystery gift (mass gift) event
            client.on("submysterygift", (channel, username, numbOfSubs, methods, userstate) => {
                const giftMessage: ChatMessage = {
                    id: `mysterygift-${Date.now()}-${username}`,
                    username: username,
                    displayName: userstate['display-name'] || username,
                    userId: userstate['user-id'] || '',
                    content: `${userstate['display-name'] || username} is gifting ${numbOfSubs} subs to the community!`,
                    parsedContent: [`is gifting ${numbOfSubs} Tier ${methods.plan?.charAt(0) || '1'} subs to the community! 🎁`],
                    color: userstate.color || '#00c87f',
                    timestamp: Date.now(),
                    type: 'submysterygift',
                    isAction: false,
                    isFirstMessage: false,
                    isHighlighted: false,
                    badges: [],
                    platform: 'twitch',
                    isShared: false,
                    subInfo: {
                        months: 1,
                        tier: (methods.plan as '1000' | '2000' | '3000') || '1000',
                        isPrime: false,
                        giftCount: numbOfSubs
                    }
                };
                addSystemMessage(giftMessage);
            });

            // Raid event
            client.on("raided", (channel, username, viewers) => {
                const raidMessage: ChatMessage = {
                    id: `raid-${Date.now()}-${username}`,
                    username: username,
                    displayName: username,
                    userId: '',
                    content: `${username} is raiding with ${viewers} viewers!`,
                    parsedContent: [`${username} is raiding with ${viewers.toLocaleString()} viewers! 🎉`],
                    color: '#ff6b6b',
                    timestamp: Date.now(),
                    type: 'raid',
                    isAction: false,
                    isFirstMessage: false,
                    isHighlighted: false,
                    badges: [],
                    platform: 'twitch',
                    isShared: false,
                    raidInfo: {
                        displayName: username,
                        viewerCount: viewers
                    }
                };
                addSystemMessage(raidMessage);
            });

            // Room state changes (slow mode, emote-only, etc.)
            client.on("roomstate", (channel, state) => {
                const followersOnlyVal = state['followers-only'];
                let followersOnlyNum = -1;
                if (followersOnlyVal !== undefined && followersOnlyVal !== false) {
                    followersOnlyNum = followersOnlyVal === true ? 0 : parseInt(String(followersOnlyVal));
                }

                setRoomState({
                    slowMode: state.slow ? parseInt(String(state.slow)) : 0,
                    emoteOnly: state['emote-only'] === true,
                    followersOnly: followersOnlyNum,
                    subsOnly: state['subs-only'] === true,
                    r9k: state.r9k === true
                });
                console.log('📋 Room state updated:', state);
            });

            // Slow mode specific
            client.on("slowmode", (channel, enabled, length) => {
                setRoomState(prev => ({ ...prev, slowMode: enabled ? length : 0 }));
            });

            // Emote-only mode
            client.on("emoteonly", (channel, enabled) => {
                setRoomState(prev => ({ ...prev, emoteOnly: enabled }));
            });

            // Followers-only mode
            client.on("followersonly", (channel, enabled, length) => {
                setRoomState(prev => ({ ...prev, followersOnly: enabled ? length : -1 }));
            });

            // Subscribers-only mode
            client.on("subscribers", (channel, enabled) => {
                setRoomState(prev => ({ ...prev, subsOnly: enabled }));
            });

            // Message deleted (mod action)
            client.on("messagedeleted", (channel, username, deletedMessage, userstate) => {
                const msgId = userstate['target-msg-id'];
                if (msgId) {
                    setDeletedMessages(prev => new Set([...prev, msgId]));
                }
            });

            // Timeout (mod action)
            client.on("timeout", (channel, username, reason, duration, userstate) => {
                const modMessage: ChatMessage = {
                    id: `timeout-${Date.now()}-${username}`,
                    username: 'system',
                    displayName: 'Mod Action',
                    userId: '',
                    content: `${username} has been timed out for ${duration}s`,
                    parsedContent: [`⏱️ ${username} timed out for ${duration}s`],
                    color: '#ff9800',
                    timestamp: Date.now(),
                    type: 'system',
                    isAction: false,
                    isFirstMessage: false,
                    isHighlighted: false,
                    badges: [],
                    platform: 'twitch',
                    isShared: false
                };
                addSystemMessage(modMessage);
            });

            // Ban (mod action)
            client.on("ban", (channel, username, reason, userstate) => {
                const modMessage: ChatMessage = {
                    id: `ban-${Date.now()}-${username}`,
                    username: 'system',
                    displayName: 'Mod Action',
                    userId: '',
                    content: `${username} has been banned`,
                    parsedContent: [`🔨 ${username} has been banned`],
                    color: '#f44336',
                    timestamp: Date.now(),
                    type: 'system',
                    isAction: false,
                    isFirstMessage: false,
                    isHighlighted: false,
                    badges: [],
                    platform: 'twitch',
                    isShared: false
                };
                addSystemMessage(modMessage);
            });

            client.on("connected", () => {
                setTwitchConnected(true);
                console.log(`✅ Connected to #${channel}`);
            });

            client.on("disconnected", () => {
                setTwitchConnected(false);
                console.log(`❌ Disconnected from #${channel}`);
            });

                try {
                    await client.connect();
                } catch (err) {
                    console.error("Failed to connect to Twitch:", err);
                }
            }
        }


    });

    onCleanup(() => {
        keepAlive = false;
        if (client) {
            client.disconnect().catch(console.error);
        }
        if (kickReconnectTimer) {
            window.clearTimeout(kickReconnectTimer);
        }
        if (kickSocket) {
            kickSocket.close();
        }
    });

    return (
        <>
            <MySiteTitle>#{params.channel}</MySiteTitle>

            {/* Room State Indicators */}
            <Show when={config().platform !== 'kick' && config().showRoomState && (roomState().slowMode > 0 || roomState().emoteOnly || roomState().followersOnly >= 0 || roomState().subsOnly || roomState().r9k)}>
                <div class="room-state-bar">
                    <Show when={roomState().slowMode > 0}>
                        <span class="room-state-badge room-state-badge--slow">
                            🐢 Slow Mode: {roomState().slowMode}s
                        </span>
                    </Show>
                    <Show when={roomState().emoteOnly}>
                        <span class="room-state-badge room-state-badge--emote">
                            😀 Emote Only
                        </span>
                    </Show>
                    <Show when={roomState().followersOnly >= 0}>
                        <span class="room-state-badge room-state-badge--followers">
                            💜 Followers{roomState().followersOnly > 0 ? ` (${roomState().followersOnly}m)` : ''}
                        </span>
                    </Show>
                    <Show when={roomState().subsOnly}>
                        <span class="room-state-badge room-state-badge--subs">
                            ⭐ Sub Only
                        </span>
                    </Show>
                    <Show when={roomState().r9k}>
                        <span class="room-state-badge room-state-badge--r9k">
                            🤖 R9K
                        </span>
                    </Show>
                </div>
            </Show>

            {/* Chat Container */}
            <div
                class="fixed inset-0 pointer-events-none p-4 flex items-end overflow-hidden"
                style={{
                    "font-size": `${config().fontSize}px`,
                    "--chat-font-size": `${config().fontSize}px`,
                    "font-family": `"${config().fontFamily}", "Segoe UI", "Inter", sans-serif`,
                    "--emote-scale": config().emoteScale,
                    "--fade-delay": `${config().fadeOutDelay / 1000}s`
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
                                data-fading={config().fadeOutMessages ? "true" : "false"}
                                style={{
                                    "animation-delay": `${index() * 20}ms, var(--fade-delay)`,
                                    ...(msg.isAction ? { color: msg.color } : {})
                                }}
                            >
                                {/* Reply Context */}
                                <Show when={msg.reply && config().showReplies}>
                                    <div class="reply-context">
                                        <svg class="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                                        </svg>
                                        <span class="reply-context__username">@{msg.reply!.parentDisplayName}</span>
                                        <span class="reply-context__body">{msg.reply!.parentMsgBody}</span>
                                    </div>
                                </Show>

                                {/* First Message Indicator */}
                                <Show when={msg.isFirstMessage && config().showFirstMessage}>
                                    <div class="first-message-indicator mb-1 inline-block">
                                        First Message
                                    </div>
                                </Show>

                                <div class="flex items-start gap-2 flex-wrap leading-snug pointer-events-auto">
                                    {/* Timestamp */}
                                    <Show when={config().showTimestamps}>
                                        <span class="timestamp self-center">
                                            {formatTime(msg.timestamp)}
                                        </span>
                                    </Show>

                                    {/* Shared Chat Badge */}
                                    <Show when={msg.isShared && config().showSharedChat}>
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
                                    <Show when={(config().showBadges && msg.badges.length > 0) || config().showPlatformBadge}>
                                        <div class="flex gap-1 self-center shrink-0 select-none items-center">
                                            <Show when={config().showPlatformBadge}>
                                                <img
                                                    src={PLATFORM_LOGOS[(msg.platform || config().platform) === 'kick' ? 'kick' : 'twitch']}
                                                    alt={(msg.platform || config().platform) === 'kick' ? 'Kick' : 'Twitch'}
                                                    class="platform-logo"
                                                    loading="lazy"
                                                />
                                            </Show>
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
                                        <Show when={msg.pronouns && config().showPronouns}>
                                            <span
                                                class={`${config().pridePronouns ? 'pronouns-badge--pride' : 'pronouns-badge--colored'} mr-1.5`}
                                                style={!config().pridePronouns ? {
                                                    background: msg.pronounColor || '#A855F7',
                                                    "background-size": msg.pronounIsGradient ? '200% 200%' : undefined,
                                                    animation: msg.pronounIsGradient ? 'pride-shimmer 3s ease infinite' : undefined
                                                } : undefined}
                                            >
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
                                                    ) : part.type === 'cheer' ? (
                                                        <span class="inline-flex items-center gap-0.5 mx-0.5" style={{ color: part.color }}>
                                                            <img src={part.url} alt={part.prefix} class="h-5 w-5" loading="lazy" />
                                                            <span class="font-bold text-sm">{part.bits}</span>
                                                        </span>
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

import { useParams, useSearchParams, useLocation, useNavigate } from "solid-start";
import { createSignal, onMount, onCleanup, For, Show, createEffect, createMemo } from "solid-js";
import tmi from "tmi.js";
import MySiteTitle from "~/components/MySiteTitle";
import ChatMessageItem from "~/chat/components/ChatMessage";
import RoomStateBar, { type RoomState } from "~/chat/components/RoomStateBar";
import { createEmoteFinder, loadYouTubeEmojiMap, parseKickMessageContent as parseKickMessageContentBase, parseTwitchMessageContent as parseTwitchMessageContentBase, parseVeloraMessageContent as parseVeloraMessageContentBase, parseYouTubeMessageContent as parseYouTubeMessageContentBase, type EmoteSources } from "~/chat/messagePipeline";
import { createSoundPlayer, formatTime, generateColor, getMessageBubbleClass, getMessageClass, isClearChatNotice } from "~/chat/messageUtils";
import { fetchKickChannelData, fetchTwitchUserByLogin, fetchVeloraBadgesCatalog, fetchVeloraBadgesForChannel, fetchVeloraEmotes, fetchVeloraHistory, fetchYouTubeLiveChat, fetchYouTubeMessages, resolveVeloraEmotes as resolveVeloraEmotesClient, resolveVeloraUser } from "~/chat/platformClients";
import { parseChatConfig, type ChatConfig } from "~/utils/chatConfig";
import "~/styles/chat.css";

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
    fetchFFZGlobalEmotes, fetchFFZChannelEmotes
} from "~/utils/emotes";
import {
    type ChatMessage,
    type MessageType,
    type ParsedPart,
    type ReplyInfo
} from "~/utils/messageTypes";

// Known bot usernames
const KNOWN_BOTS = new Set([
    'nightbot', 'streamelements', 'moobot', 'fossabot', 'streamlabs',
    'soundalerts', 'wizebot', 'botisimo', 'coebot', 'deepbot', 'phantombot',
    'stay_hydrated_bot', 'streamholics', 'anotherttvviewer', 'commanderroot',
    'drapsnern'
]);

export default function Chat() {
    const params = useParams<{ channel?: string; platform?: string }>();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();

    createEffect(() => {
        if (location.pathname.startsWith('/v3/')) {
            const nextConfig = parseChatConfig(params, searchParams);
            const platforms = nextConfig.platforms;
            const channelSegment = params.channel ? `/${params.channel}` : '';
            const basePath = platforms.length > 1
                ? '/chat/combined'
                : `/chat/${platforms[0]}${channelSegment}`;
            const nextPath = `${basePath}${location.search}`;
            navigate(nextPath, { replace: true });
        }
    });

    // State
    const [messages, setMessages] = createSignal<ChatMessage[]>([]);
    const [twitchConnected, setTwitchConnected] = createSignal(false);
    const [kickConnected, setKickConnected] = createSignal(false);
    const [youtubeConnected, setYoutubeConnected] = createSignal(false);
    const [veloraConnected, setVeloraConnected] = createSignal(false);
    const [channelId, setChannelId] = createSignal<string | null>(null);

    // Room State (slow mode, emote-only, etc.)
    const [roomState, setRoomState] = createSignal<RoomState>({
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
    let youtubePollTimer: number | undefined;
    let youtubeNextPageToken: string | null = null;
    let youtubeLiveChatId: string | null = null;
    let youtubeSeenMessageIds = new Set<string>();
    let youtubeEmojiMap: Map<string, string> | null = null;
    let veloraPollTimer: number | undefined;
    let veloraSeenMessageIds = new Set<string>();
    let veloraChannelId: string | null = null;
    let veloraStreamId: string | null = null;
    let veloraMinTimestamp = 0;
    let veloraEmoteMap = new Map<string, string>();
    let veloraResolveInFlight = new Set<string>();
    let veloraBadgeMap = new Map<string, { url: string; title?: string }>();
    let veloraChannelAccent: string | undefined;
    let messageContainer: HTMLUListElement | undefined;

    // Emote storage
    const emoteSources: EmoteSources = {
        global7TV: [],
        channel7TV: [],
        channel7TVKick: [],
        channel7TVYouTube: [],
        globalBTTV: [],
        channelBTTV: [],
        globalFFZ: [],
        channelFFZ: [],
    };
    const findEmote = createEmoteFinder(emoteSources);

    // Parse config from URL params reactively
    const config = createMemo<ChatConfig>(() => parseChatConfig(params, searchParams));
    const title = createMemo(() => {
        const platforms = config().platforms;
        if (platforms.length > 1 || params.platform === 'combined') return 'Combined Chat';
        const channel = params.channel
            || config().twitchChannel
            || config().kickChannel
            || config().youtubeChannel
            || config().veloraChannel;
        return channel ? `#${channel}` : 'Chat';
    });

    const isConnected = createMemo(() => {
        const platforms = config().platforms;
        if (platforms.includes('twitch') && twitchConnected()) return true;
        if (platforms.includes('kick') && kickConnected()) return true;
        if (platforms.includes('youtube') && youtubeConnected()) return true;
        if (platforms.includes('velora') && veloraConnected()) return true;
        return false;
    });

    createEffect(() => {
        if (typeof document === 'undefined') return;
        const bg = config().pageBackground;
        const color = bg === 'dark'
            ? 'rgba(8, 8, 10, 1)'
            : bg === 'dim'
                ? 'rgba(8, 8, 10, 0.6)'
                : 'transparent';
        document.body.style.backgroundColor = color;
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
        maybePlayMessageSound(msg.timestamp || Date.now());
        setMessages(prev => {
            const updated = [...prev, msg];
            if (updated.length > config().maxMessages) {
                return updated.slice(-config().maxMessages);
            }
            return updated;
        });
    };

    const parseMessageContent = (
        text: string,
        twitchEmotes: { [id: string]: string[] } | undefined,
        _bits?: number,
        platform: 'twitch' | 'kick' | 'youtube' = 'twitch'
    ): ParsedPart[] => parseTwitchMessageContentBase(text, twitchEmotes, config().showEmotes, findEmote, platform);

    const parseYouTubeMessageContent = (text: string, emojis?: any[], emojiMap?: Map<string, string> | null): ParsedPart[] =>
        parseYouTubeMessageContentBase(text, emojis, emojiMap || null, config().showEmotes);

    const parseKickMessageContent = (text: string, emotes?: any[]): ParsedPart[] =>
        parseKickMessageContentBase(text, emotes, config().showEmotes, findEmote);

    const parseVeloraMessageContent = (text: string, emotes?: any[]): ParsedPart[] =>
        parseVeloraMessageContentBase(text, emotes, config().showEmotes, veloraEmoteMap);

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
        if (tags['msg-id'] === 'highlighted-message' && config().showHighlights) {
            messageType = 'highlighted';
        }

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
        const timestamp = Date.now();
        maybePlayMessageSound(timestamp);
        const badges = await getUserBadges(badgeSource, userId);
        const parsedContent = parseMessageContent(message, tags.emotes, bits, 'twitch');

        const dedupeBadges = (badges: Badge[]) => {
            const seen = new Set<string>();
            return badges.filter((badge) => {
                const key = `${badge.url}|${badge.title}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        };

        const newMessage: ChatMessage = {
            id: messageId,
            username,
            displayName: tags['display-name'] || username,
            userId,
            content: message,
            parsedContent,
            color: tags.color || generateColor(username),
            timestamp,
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
        if (config().showBadges) {
            Promise.all([
                fetch7TVUserBadges(userId, 'twitch'),
                fetchFFZUserBadges(userId)
            ]).then(([sevenTVBadges, ffzBadges]) => {
                if (!keepAlive) return;
                const extraBadges = dedupeBadges([...sevenTVBadges, ...ffzBadges]);
                if (extraBadges.length === 0) return;

                setMessages(prev => prev.map(m =>
                    m.id === messageId
                        ? { ...m, badges: dedupeBadges([...m.badges, ...extraBadges]) }
                        : m
                ));
            });
        }
    };

    const KICK_PUSHER_URL = "wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.4.0-rc2&flash=false";

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

        maybePlayMessageSound(timestamp);
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

    const { maybePlayMessageSound } = createSoundPlayer(() => config().playSound);

    const clearChatMessages = () => {
        setMessages([]);
    };

    const getMessageClassName = (msg: ChatMessage) => getMessageClass(msg);

    const getMessageBubbleClassName = (msg: ChatMessage) =>
        getMessageBubbleClass(msg, {
            showHighlights: config().showHighlights,
            showFirstMessage: config().showFirstMessage,
            deletedMessages: deletedMessages(),
        });

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

        emoteSources.global7TV = g7tv;
        emoteSources.channel7TVKick = c7tv;

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

    const getYouTubeAuthorColor = (author: any) => {
        if (author?.isChatOwner) return '#facc15';
        if (author?.isChatModerator) return '#60a5fa';
        if (author?.isChatSponsor) return '#34d399';
        const fallback = author?.displayName || author?.channelId || 'youtube';
        return generateColor(fallback);
    };

    const addYouTubeMessage = (item: any) => {
        if (!item?.id || youtubeSeenMessageIds.has(item.id)) return;
        youtubeSeenMessageIds.add(item.id);

        const snippet = item?.snippet;
        const author = item?.authorDetails;
        if (!snippet || !author) return;

        let content = '';
        let rawText = '';
        let messageType: MessageType = 'chat';
        let isHighlighted = false;
        const emojiList =
            item?.snippet?.textMessageDetails?.emoji ||
            item?.snippet?.emojis ||
            item?.snippet?.emoji ||
            [];

        if (snippet.type === 'textMessageEvent') {
            rawText = snippet.textMessageDetails?.messageText || '';
            content = snippet.displayMessage || rawText;
        } else if (snippet.type === 'superChatEvent') {
            rawText = snippet.superChatDetails?.userComment || '';
            content = snippet.displayMessage || rawText;
            messageType = 'highlighted';
            isHighlighted = true;
        } else if (snippet.type === 'superStickerEvent') {
            rawText = '';
            content = snippet.displayMessage || 'sent a Super Sticker';
            messageType = 'highlighted';
            isHighlighted = true;
        } else {
            return;
        }

        if (!config().showHighlights && messageType === 'highlighted') {
            messageType = 'chat';
            isHighlighted = false;
        }

        if (!content && !rawText) return;
        if (!rawText) rawText = content;

        const timestamp = snippet.publishedAt ? Date.parse(snippet.publishedAt) : Date.now();
        const displayName = author.displayName || 'YouTube';
        const username = displayName.toLowerCase().replace(/\s+/g, '');

        const parsedContent = parseYouTubeMessageContent(rawText, emojiList, youtubeEmojiMap);

        const newMessage: ChatMessage = {
            id: item.id,
            username,
            displayName,
            userId: author.channelId || username,
            content,
            parsedContent,
            color: getYouTubeAuthorColor(author),
            timestamp,
            type: messageType,
            isAction: false,
            isFirstMessage: false,
            isHighlighted,
            badges: [],
            platform: 'youtube',
            isShared: false,
        };

        maybePlayMessageSound(timestamp);
        setMessages(prev => {
            const updated = [...prev, newMessage];
            if (updated.length > config().maxMessages) {
                return updated.slice(-config().maxMessages);
            }
            return updated;
        });

        if (config().showEmotes && rawText.includes(':') && emojiList.length === 0) {
            loadYouTubeEmojiMap().then((map) => {
                if (!keepAlive || map.size === 0) return;
                youtubeEmojiMap = map;
                setMessages(prev => prev.map(m =>
                    m.id === item.id
                        ? { ...m, parsedContent: parseYouTubeMessageContent(rawText, emojiList, map) }
                        : m
                ));
            });
        }

        if (config().showNamePaints && author.channelId) {
            get7TVUserPaint(author.channelId, 'youtube').then(paint => {
                if (!keepAlive || !paint) return;
                const { style } = getNamePaintStyles(paint);
                setMessages(prev => prev.map(m =>
                    m.id === item.id ? { ...m, paint: style } : m
                ));
            });
        }
    };

    const pollYouTubeChat = async () => {
        if (!youtubeLiveChatId || !keepAlive) return;

        try {
            const data = await fetchYouTubeMessages(youtubeLiveChatId, youtubeNextPageToken);
            if (!data) {
                setYoutubeConnected(false);
                return;
            }
            youtubeNextPageToken = data.nextPageToken || youtubeNextPageToken;
            const items = Array.isArray(data.items) ? data.items : [];
            items.forEach(addYouTubeMessage);
            setYoutubeConnected(true);
            const delay = typeof data.pollingIntervalMillis === 'number' ? data.pollingIntervalMillis : 5000;
            youtubePollTimer = window.setTimeout(pollYouTubeChat, Math.max(2000, delay));
        } catch (e) {
            console.error("Failed to poll YouTube chat:", e);
            setYoutubeConnected(false);
            youtubePollTimer = window.setTimeout(pollYouTubeChat, 7000);
        }
    };

    const connectYouTube = async (channel: string) => {
        console.log(`🔴 Kroma - Connecting to YouTube #${channel}`);
        const info = await fetchYouTubeLiveChat(channel);
        if (!info?.liveChatId) {
            console.error("Failed to resolve YouTube liveChatId.");
            return;
        }
        youtubeLiveChatId = info.liveChatId;
        youtubeNextPageToken = null;
        youtubeSeenMessageIds.clear();
        if (emoteSources.global7TV.length === 0) {
            emoteSources.global7TV = await fetch7TVGlobalEmotes();
        }
        if (info.channelId) {
            emoteSources.channel7TVYouTube = await fetch7TVChannelEmotes(info.channelId, 'youtube');
        }
        pollYouTubeChat();
    };

    const makeVeloraBadgeSvg = (label: string, bg: string, fg = "#ffffff") => {
        const safeLabel = label.slice(0, 3).toUpperCase();
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
                <rect x="0.5" y="0.5" width="17" height="17" rx="4" ry="4" fill="${bg}" stroke="rgba(255,255,255,0.35)" stroke-width="1"/>
                <text x="9" y="9" text-anchor="middle" dominant-baseline="middle" fill="${fg}" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="9" font-weight="700">${safeLabel}</text>
            </svg>
        `;
        return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    };

    const VELORA_FALLBACK_BADGES = new Map<string, { url: string; title: string }>([
        ["broadcaster", { url: "https://velora.tv/velora-badges/StreamerBroadcasterBadge.png", title: "Broadcaster" }],
        ["owner", { url: "https://velora.tv/velora-badges/StreamerBroadcasterBadge.png", title: "Broadcaster" }],
        ["moderator", { url: "https://velora.tv/velora-badges/ModeratorModBadge.png", title: "Moderator" }],
        ["mod", { url: "https://velora.tv/velora-badges/ModeratorModBadge.png", title: "Moderator" }],
        ["subscriber", { url: makeVeloraBadgeSvg("SU", "#3b82f6"), title: "Subscriber" }],
        ["vip", { url: "https://velora.tv/velora-badges/VIPBadge.png", title: "VIP" }],
        ["admin", { url: "https://velora.tv/velora-badges/VeloraCommunityManagement.png", title: "Community Management" }],
        ["staff-community", { url: "https://velora.tv/velora-badges/VeloraCommunityManagement.png", title: "Community Management" }],
        ["bot", { url: "https://velora.tv/velora-badges/BotBadge.png", title: "Bot" }],
    ]);

    const extractVeloraBadgeList = (data: any): any[] => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (Array.isArray(data.badges)) return data.badges;
        if (Array.isArray(data.items)) return data.items;
        if (Array.isArray(data.data)) return data.data;
        if (Array.isArray(data.results)) return data.results;
        return [];
    };

    const getVeloraBadgeUrl = (badge: any) => {
        const assetVariants = badge?.assetVariants || badge?.assets || badge?.variants;
        return (
            badge?.url ||
            badge?.imageUrl ||
            badge?.image_url ||
            badge?.image ||
            badge?.src ||
            badge?.icon ||
            badge?.staticAssetUrl ||
            badge?.animatedAssetUrl ||
            assetVariants?.static2x ||
            assetVariants?.static1x ||
            assetVariants?.static4x ||
            assetVariants?.animated2x ||
            assetVariants?.animated1x ||
            assetVariants?.animated4x
        );
    };

    const loadVeloraBadgeCatalog = async () => {
        try {
            const data = await fetchVeloraBadgesCatalog();
            if (!data) return;
            const list = extractVeloraBadgeList(data);
            list.forEach((badge: any) => {
                const key = String(badge?.key || badge?.slug || badge?.id || badge?.name || badge?.code || "").toLowerCase();
                if (!key) return;
                const url = getVeloraBadgeUrl(badge);
                if (url) {
                    veloraBadgeMap.set(key, { url: String(url), title: badge?.title || badge?.label || badge?.name });
                }
            });
        } catch (e) {
            console.error("Failed to load Velora badge catalog:", e);
        }
    };

    const loadVeloraChannelBadges = async (username: string) => {
        try {
            const data = await fetchVeloraBadgesForChannel(username);
            if (!data) return;
            const list = extractVeloraBadgeList(data);
            list.forEach((badge: any) => {
                const key = String(badge?.key || badge?.slug || badge?.id || badge?.name || badge?.code || "").toLowerCase();
                if (!key) return;
                const url = getVeloraBadgeUrl(badge);
                if (url) {
                    veloraBadgeMap.set(key, { url: String(url), title: badge?.title || badge?.label || badge?.name });
                }
            });
        } catch (e) {
            console.error("Failed to load Velora channel badges:", e);
        }
    };


    const loadVeloraEmotes = async (channelId: string) => {
        try {
            const data = await fetchVeloraEmotes(channelId);
            if (!data) return;
            const map = new Map<string, string>();
            const globalEmotes = Array.isArray(data?.global) ? data.global : [];
            const channelEmotes = Array.isArray(data?.channel) ? data.channel : [];
            [...globalEmotes, ...channelEmotes].forEach((emote: any) => {
                if (!emote?.code || !emote?.url) return;
                map.set(String(emote.code), String(emote.url));
            });
            veloraEmoteMap = map;
        } catch (e) {
            console.error("Failed to load Velora emotes:", e);
        }
    };

    const extractVeloraEmoteList = (data: any): any[] => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (Array.isArray(data.emotes)) return data.emotes;
        if (Array.isArray(data.items)) return data.items;
        if (Array.isArray(data.data)) return data.data;
        if (Array.isArray(data.results)) return data.results;
        return [];
    };

    const resolveVeloraEmotes = async (codes: string[]) => {
        if (codes.length === 0) return;
        const unique = Array.from(new Set(codes)).filter(code => code && code.length <= 32);
        const pending = unique.filter(code => !veloraEmoteMap.has(code) && !veloraResolveInFlight.has(code));
        if (pending.length === 0) return;
        pending.forEach(code => veloraResolveInFlight.add(code));

        try {
            const data = await resolveVeloraEmotesClient(pending);
            if (!data) return;
            if (data && typeof data === "object" && !Array.isArray(data)) {
                Object.entries(data).forEach(([key, value]) => {
                    if (typeof value === "string") {
                        veloraEmoteMap.set(String(key), value);
                        return;
                    }
                    if (value && typeof value === "object") {
                        const url = (value as any).url || (value as any).imageUrl || (value as any).image_url || (value as any).image || (value as any).src;
                        if (url) {
                            veloraEmoteMap.set(String(key), String(url));
                        }
                    }
                });
            }
            const list = extractVeloraEmoteList(data);
            list.forEach((item: any) => {
                const code = item?.code || item?.name || item?.text || item?.shortcode || item?.shortCode || item?.id;
                const assetVariants = item?.assetVariants || item?.assets || item?.variants;
                const variantUrl =
                    assetVariants?.animated2x ||
                    assetVariants?.animated1x ||
                    assetVariants?.animated4x ||
                    assetVariants?.static2x ||
                    assetVariants?.static1x ||
                    assetVariants?.static4x;
                const url =
                    item?.url ||
                    item?.imageUrl ||
                    item?.image_url ||
                    item?.image ||
                    item?.src ||
                    item?.images?.full ||
                    item?.images?.original ||
                    variantUrl;
                if (code && url) {
                    veloraEmoteMap.set(String(code), String(url));
                }
            });
        } catch (e) {
            console.error("Failed to resolve Velora emotes:", e);
        } finally {
            pending.forEach(code => veloraResolveInFlight.delete(code));
        }
    };

    const extractVeloraMessages = (data: any): any[] => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (Array.isArray(data.messages)) return data.messages;
        if (Array.isArray(data.items)) return data.items;
        if (Array.isArray(data.data)) return data.data;
        if (Array.isArray(data.results)) return data.results;
        return [];
    };

    const addVeloraMessage = (item: any) => {
        const messageId = item?.id || item?.messageId || item?.message_id || item?._id || item?.uuid;
        if (!messageId) return;
        const messageKey = String(messageId);
        if (veloraSeenMessageIds.has(messageKey)) return;
        veloraSeenMessageIds.add(messageKey);

        const user = item?.user || item?.author || item?.sender || {};
        const username = String(user?.username || user?.handle || user?.slug || item?.username || "unknown");
        const displayName = String(user?.displayName || user?.display_name || item?.displayName || username);
        const userId = String(user?.id || user?.userId || item?.userId || username);
        const cardSource = item?.metadata?.card || item?.card || item?.metadata?.payload?.card;
        const cardType = typeof cardSource?.type === "string" ? cardSource.type : undefined;
        const cardPayload = cardSource?.payload;

        const content = String(item?.message || item?.content || item?.text || "");
        const accentColor = veloraChannelAccent
            || (typeof item?.accentColor === "string" ? item.accentColor : undefined)
            || (typeof user?.accentColor === "string" ? user.accentColor : undefined)
            || (typeof user?.profileTheme?.accentColor === "string" ? user.profileTheme.accentColor : undefined);
        if (!content && !cardType) return;

        const rawTimestamp = item?.createdAt || item?.created_at || item?.timestamp || item?.time;
        const timestamp = rawTimestamp
            ? (() => {
                const numeric = Number(rawTimestamp);
                if (!Number.isNaN(numeric)) {
                    return numeric > 10_000_000_000 ? numeric : numeric * 1000;
                }
                const parsed = new Date(String(rawTimestamp)).getTime();
                return Number.isNaN(parsed) ? Date.now() : parsed;
            })()
            : Date.now();

        if (veloraMinTimestamp && timestamp < veloraMinTimestamp) {
            return;
        }

        if (config().hideBots && KNOWN_BOTS.has(username.toLowerCase())) return;
        if (config().blockedUsers.includes(username.toLowerCase())) return;
        if (config().customBots.includes(username.toLowerCase())) return;
        if (config().hideCommands && content.startsWith("!")) return;

        const collectVeloraBadges = (source: any): Badge[] => {
            const entries = Array.isArray(source) ? source : [];
            return entries.flatMap((badge: any, index: number) => {
                if (!badge) return [];
                if (typeof badge === "string") {
                    const normalized = badge.toLowerCase();
                    const lookup = veloraBadgeMap.get(normalized) || VELORA_FALLBACK_BADGES.get(normalized);
                    if (!lookup?.url) return [];
                    return [{
                        id: `velora-${badge}-${index}`,
                        title: lookup.title || badge,
                        url: lookup.url,
                        provider: "velora"
                    }];
                }
                const badgeKey = String(badge?.key || badge?.slug || badge?.id || badge?.name || badge?.code || badge?.type || badge?.role || badge?.label || "").toLowerCase();
                const url = getVeloraBadgeUrl(badge);
                const fallback = badgeKey ? VELORA_FALLBACK_BADGES.get(badgeKey) : undefined;
                const resolvedUrl = url || fallback?.url;
                if (!resolvedUrl) return [];
                const title = badge?.title || badge?.name || badge?.label || badge?.type || "Badge";
                return [{
                    id: `velora-${badge?.id || badgeKey || title}-${index}`,
                    title: String(fallback?.title || title),
                    url: String(resolvedUrl),
                    provider: "velora"
                }];
            });
        };

        const collectVeloraBadgeDetails = (source: any): Badge[] => {
            const entries = Array.isArray(source) ? source : [];
            return entries.flatMap((badge: any, index: number) => {
                if (!badge) return [];
                const url = badge?.animatedAssetUrl || badge?.staticAssetUrl || badge?.url || badge?.imageUrl || badge?.image_url;
                if (!url) return [];
                const title = badge?.label || badge?.name || badge?.title || badge?.slug || "Badge";
                return [{
                    id: `velora-detail-${badge?.id || badge?.slug || title}-${index}`,
                    title: String(title),
                    url: String(url),
                    provider: "velora"
                }];
            });
        };

        const badgeSource =
            item?.badges ||
            item?.badge ||
            item?.roles ||
            item?.user?.badges ||
            item?.user?.roles ||
            item?.author?.badges ||
            [];

        const roleSource = item?.userRoles || item?.roles || item?.role;
        const veloraBadges = [
            ...collectVeloraBadgeDetails(item?.badgeDetails),
            ...collectVeloraBadges(badgeSource),
            ...collectVeloraBadges(Array.isArray(roleSource) ? roleSource : roleSource ? [roleSource] : [])
        ];

        if (item?.subscriptionBadge?.staticAssetUrl) {
            veloraBadges.unshift({
                id: `velora-subscription-badge`,
                title: item?.subscriptionBadge?.label || "Subscriber",
                url: String(item.subscriptionBadge.staticAssetUrl),
                provider: "velora"
            });
        }

        const dedupeBadges = (badges: Badge[]) => {
            const seen = new Set<string>();
            return badges.filter((badge) => {
                const key = `${badge.url}|${badge.title}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        };

        const parsedContent = parseVeloraMessageContent(content, item?.emotes || item?.emoticons);

        const rawEffect = item?.effect || item?.messageEffect || item?.message_effect;
        const normalizeVeloraEffect = (value: string) => {
            const lowered = value.toLowerCase();
            if (lowered.startsWith('glow')) return 'glow';
            if (lowered.startsWith('galaxy')) return 'galaxy';
            return lowered;
        };
        const effectVariant = typeof rawEffect === "string" ? rawEffect.toLowerCase() : undefined;
        const effect = config().showHighlights && typeof rawEffect === "string"
            ? normalizeVeloraEffect(rawEffect)
            : undefined;
        const baseEffectColor = typeof item?.effectColor === "string"
            ? item.effectColor
            : typeof item?.effect_color === "string"
                ? item.effect_color
                : undefined;
        const galaxyPalette: Record<string, string> = {
            galaxy_nebula: '#8b5cf6',
            galaxy_aurora: '#22c55e',
            galaxy_cosmic: '#3b82f6',
            galaxy_stardust: '#ec4899'
        };
        const effectColor = effect === 'galaxy' && effectVariant && galaxyPalette[effectVariant]
            ? galaxyPalette[effectVariant]
            : baseEffectColor;

        const isSystem = item?.isSystem === true || item?.role === "system";
        if (isSystem && isClearChatNotice(content)) {
            clearChatMessages();
            veloraMinTimestamp = Date.now();
        }
        const newMessage: ChatMessage = {
            id: messageKey,
            username,
            displayName,
            userId,
            content,
            parsedContent,
            color: generateColor(username),
            timestamp,
            type: isSystem ? "system" : "chat",
            isAction: false,
            isFirstMessage: false,
            isHighlighted: false,
            badges: dedupeBadges(veloraBadges),
            platform: "velora",
            isShared: false,
            effect,
            effectVariant,
            effectColor,
            veloraCard: cardType ? { type: cardType, payload: cardPayload } : undefined,
            accentColor,
        };

        maybePlayMessageSound(timestamp);
        setMessages(prev => {
            const updated = [...prev, newMessage];
            if (updated.length > config().maxMessages) {
                return updated.slice(-config().maxMessages);
            }
            return updated;
        });

        if (config().showEmotes) {
            const tokens = content.split(/\s+/).map(t => t.trim()).filter(Boolean);
            const normalized = tokens.map(token => token.replace(/^[^\w]+|[^\w]+$/g, ""));
            const candidates = normalized.filter(token => token && !token.startsWith("@") && !token.startsWith("http") && token.length <= 32);
            const missing = candidates.filter(token => !veloraEmoteMap.has(token));
            if (missing.length > 0) {
                resolveVeloraEmotes(missing).then(() => {
                    if (!keepAlive) return;
                    setMessages(prev => prev.map(m =>
                        m.id === messageKey
                            ? { ...m, parsedContent: parseVeloraMessageContent(content, item?.emotes || item?.emoticons) }
                            : m
                    ));
                });
            }
        }
    };

    const pollVeloraChat = async () => {
        if (!veloraChannelId || !keepAlive) return;

        try {
            const responses: any[] = [];
            const channelHistory = await fetchVeloraHistory(veloraChannelId);
            if (channelHistory) {
                responses.push(channelHistory);
            }
            if (veloraStreamId && veloraStreamId !== veloraChannelId) {
                const streamHistory = await fetchVeloraHistory(veloraStreamId);
                if (streamHistory) {
                    responses.push(streamHistory);
                }
            }
            if (responses.length === 0) {
                setVeloraConnected(false);
                veloraPollTimer = window.setTimeout(pollVeloraChat, 3000);
                return;
            }
            const items = responses.flatMap(extractVeloraMessages);
            items
                .map((item: any) => {
                    const raw = item?.createdAt || item?.created_at || item?.timestamp || item?.time;
                    const numeric = Number(raw);
                    const ts = Number.isNaN(numeric) ? new Date(String(raw)).getTime() : (numeric > 10_000_000_000 ? numeric : numeric * 1000);
                    return { item, ts: Number.isNaN(ts) ? Date.now() : ts };
                })
                .sort((a, b) => a.ts - b.ts)
                .forEach(({ item }) => addVeloraMessage(item));

            setVeloraConnected(true);
            veloraPollTimer = window.setTimeout(pollVeloraChat, 2500);
        } catch (e) {
            console.error("Failed to poll Velora chat:", e);
            setVeloraConnected(false);
            veloraPollTimer = window.setTimeout(pollVeloraChat, 3500);
        }
    };

    const connectVelora = async (username: string) => {
        console.log(`🟦 Kroma - Connecting to Velora #${username}`);
        const resolved = await resolveVeloraUser(username);
        const channelId = resolved?.userId || resolved?.raw?.id;
        const streamId = resolved?.raw?.streamInfo?.id;
        veloraChannelAccent = typeof resolved?.raw?.profileTheme?.accentColor === "string"
            ? resolved.raw.profileTheme.accentColor
            : undefined;
        if (!channelId) {
            console.warn("Failed to resolve Velora channel ID, falling back to username.");
            veloraChannelId = username;
        } else {
            veloraChannelId = String(channelId);
        }
        veloraStreamId = streamId ? String(streamId) : null;
        veloraSeenMessageIds.clear();
        veloraMinTimestamp = Date.now();
        await Promise.all([
            loadVeloraEmotes(veloraChannelId),
            loadVeloraBadgeCatalog(),
            loadVeloraChannelBadges(username)
        ]);
        pollVeloraChat();
    };

    onMount(async () => {
        const selectedPlatforms = config().platforms;
        const hasKick = selectedPlatforms.includes('kick');
        const hasTwitch = selectedPlatforms.includes('twitch');
        const hasYouTube = selectedPlatforms.includes('youtube');
        const hasVelora = selectedPlatforms.includes('velora');
        const twitchChannelName = config().twitchChannel;
        const kickChannelName = config().kickChannel;
        const youtubeChannelName = config().youtubeChannel;
        const veloraChannelName = config().veloraChannel;

        if (hasKick && kickChannelName) {
            await connectKick(kickChannelName);
        }

        if (hasVelora && veloraChannelName) {
            await connectVelora(veloraChannelName);
        }

        if (hasTwitch && twitchChannelName) {
            console.log(`🎮 Kroma - Connecting to #${twitchChannelName}`);

            // Pre-cache channel info
            cacheChannelByUsername(twitchChannelName);

            // Fetch channel ID
            try {
                const data = await fetchTwitchUserByLogin(twitchChannelName);
                const id = Array.isArray(data) ? data[0]?.id : null;
                if (id) {
                    setChannelId(id);
                    console.log(`📺 Channel ID: ${id}`);
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
                fetchFFZChannelEmotes(twitchChannelName)
            ]);

            emoteSources.global7TV = g7tv;
            emoteSources.channel7TV = c7tv;
            emoteSources.globalBTTV = gBttv;
            emoteSources.channelBTTV = cBttv;
            emoteSources.globalFFZ = gFfz;
            emoteSources.channelFFZ = cFfz;

            console.log(`✨ Loaded emotes - 7TV: ${emoteSources.global7TV.length + emoteSources.channel7TV.length}, BTTV: ${emoteSources.globalBTTV.length + emoteSources.channelBTTV.length}, FFZ: ${emoteSources.globalFFZ.length + emoteSources.channelFFZ.length}`);


            if (twitchChannelName) {
                // Connect to Twitch
                client = new tmi.Client({
                    channels: [twitchChannelName],
                    connection: {
                        secure: true,
                        reconnect: true,
                    },
                });

            client.on("message", handleMessage);
            client.on("clearchat", () => {
                clearChatMessages();
            });

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
                console.log(`✅ Connected to #${twitchChannelName}`);
            });

            client.on("disconnected", () => {
                setTwitchConnected(false);
                console.log(`❌ Disconnected from #${twitchChannelName}`);
            });

                try {
                    await client.connect();
                } catch (err) {
                    console.error("Failed to connect to Twitch:", err);
                }
            }
        }

        if (hasYouTube && youtubeChannelName) {
            await connectYouTube(youtubeChannelName);
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
        if (youtubePollTimer) {
            window.clearTimeout(youtubePollTimer);
        }
        if (veloraPollTimer) {
            window.clearTimeout(veloraPollTimer);
        }
    });

    return (
        <>
            <MySiteTitle>{title()}</MySiteTitle>

            {/* Room State Indicators */}
            <RoomStateBar
                show={config().platforms.includes('twitch') && config().showRoomState && (roomState().slowMode > 0 || roomState().emoteOnly || roomState().followersOnly >= 0 || roomState().subsOnly || roomState().r9k)}
                roomState={roomState()}
            />

            {/* Chat Container */}
            <div
                class="fixed inset-0 pointer-events-none p-4 flex items-end overflow-hidden"
                style={{
                    "font-size": `${config().fontSize}px`,
                    "--chat-font-size": `${config().fontSize}px`,
                    "font-family": `"${config().fontFamily}", "Segoe UI", "Inter", sans-serif`,
                    "--emote-scale": config().emoteScale,
                    "--fade-delay": `${config().fadeOutDelay / 1000}s`,
                    "--message-gap": `0.5rem`,
                    "--message-bg-alpha": String(config().messageBgOpacity),
                    "--chat-text-color": config().textColor
                }}
            >
                <ul
                    ref={messageContainer}
                    class="chat-container w-full"
                >
                    <For each={[...messages()].reverse()}>
                        {(msg, index) => (
                            <ChatMessageItem
                                msg={msg}
                                index={index}
                                config={config}
                                getMessageClass={getMessageClassName}
                                getMessageBubbleClass={getMessageBubbleClassName}
                                formatTime={formatTime}
                            />
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

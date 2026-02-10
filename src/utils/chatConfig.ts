import type { ChatPlatform } from "./platforms";

export interface ChatConfig {
    platforms: ChatPlatform[];
    twitchChannel: string;
    kickChannel: string;
    youtubeChannel: string;
    veloraChannel: string;
    showPlatformBadge: boolean;
    showPronouns: boolean;
    pridePronouns: boolean;
    showBadges: boolean;
    showEmotes: boolean;
    showHighlights: boolean;
    showTimestamps: boolean;
    showSharedChat: boolean;
    showNamePaints: boolean;
    showReplies: boolean;
    showFirstMessage: boolean;
    playSound: boolean;
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
    pageBackground: 'transparent' | 'dim' | 'dark';
    messageBgOpacity: number;
    textColor: string;
}

export const DEFAULT_CHAT_CONFIG: ChatConfig = {
    platforms: ['twitch'],
    twitchChannel: '',
    kickChannel: '',
    youtubeChannel: '',
    veloraChannel: '',
    showPlatformBadge: true,
    showPronouns: true,
    pridePronouns: false,
    showBadges: true,
    showEmotes: true,
    showHighlights: true,
    showTimestamps: false,
    showSharedChat: true,
    showNamePaints: true,
    showReplies: true,
    showFirstMessage: true,
    playSound: false,
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
    pageBackground: 'transparent',
    messageBgOpacity: 0,
    textColor: '#ffffff',
};

export type ChatConfigParams = Record<string, string | undefined>;

const getParam = (params: ChatConfigParams, key: string) => {
    const value = params[key];
    if (Array.isArray(value)) return value[0];
    return value;
};

export const parseChatConfig = (params: { channel?: string; platform?: string }, searchParams: ChatConfigParams): ChatConfig => {
    const platformsParam = getParam(searchParams, 'platforms')
        ? String(getParam(searchParams, 'platforms'))
            .split(',')
            .map((p) => p.trim().toLowerCase())
            .filter(Boolean)
        : [];
    const legacy = getParam(searchParams, 'platform')?.toLowerCase();
    const pathPlatformRaw = params.platform ? String(params.platform).toLowerCase() : undefined;
    const pathPlatform =
        pathPlatformRaw === 'twitch' || pathPlatformRaw === 'kick' || pathPlatformRaw === 'youtube' || pathPlatformRaw === 'velora'
            ? (pathPlatformRaw as ChatPlatform)
            : undefined;
    const pathCombined = pathPlatformRaw === 'combined';
    const rawPlatforms = platformsParam.length > 0
        ? platformsParam
        : legacy === 'combined' || legacy === 'both'
            ? ['twitch', 'kick']
            : legacy === 'kick'
                ? ['kick']
                : legacy === 'youtube'
                    ? ['youtube']
                    : legacy === 'velora'
                        ? ['velora']
                        : pathPlatform
                            ? [pathPlatform]
                            : pathCombined
                                ? ['twitch', 'kick']
                                : ['twitch'];
    const platforms = rawPlatforms.filter(
        (p) => p === 'twitch' || p === 'kick' || p === 'youtube' || p === 'velora'
    ) as ChatPlatform[];
    if (platforms.length === 0) platforms.push('twitch');

    const hasTwitch = platforms.includes('twitch');
    const fallbackChannel = (params.channel || '').toLowerCase();
    const twitchChannel = (getParam(searchParams, 'twitch') || (platforms.includes('twitch') ? fallbackChannel : '')).toLowerCase();
    const kickChannel = (getParam(searchParams, 'kick') || (platforms.includes('kick') ? fallbackChannel : '')).toLowerCase();
    const youtubeChannel = (getParam(searchParams, 'youtube') || (platforms.includes('youtube') ? fallbackChannel : '')).toLowerCase();
    const veloraChannel = (getParam(searchParams, 'velora') || (platforms.includes('velora') ? fallbackChannel : '')).toLowerCase();

    const fontFamilyRaw = getParam(searchParams, 'font') || DEFAULT_CHAT_CONFIG.fontFamily;
    const fontFamily = fontFamilyRaw.replace(/\+/g, ' ');
    const pageBackgroundRaw = String(getParam(searchParams, 'bg') || DEFAULT_CHAT_CONFIG.pageBackground).toLowerCase();
    const pageBackground = pageBackgroundRaw === 'dark' || pageBackgroundRaw === 'dim' ? pageBackgroundRaw : 'transparent';
    const messageBgOpacityRaw = parseFloat(String(getParam(searchParams, 'msgBg') || DEFAULT_CHAT_CONFIG.messageBgOpacity));
    const messageBgOpacity = Number.isFinite(messageBgOpacityRaw)
        ? Math.min(0.9, Math.max(0, messageBgOpacityRaw))
        : 0;
    const textColorRaw = String(getParam(searchParams, 'textColor') || DEFAULT_CHAT_CONFIG.textColor).trim();
    const textColor = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(textColorRaw) ? textColorRaw : DEFAULT_CHAT_CONFIG.textColor;

    return {
        ...DEFAULT_CHAT_CONFIG,
        platforms,
        twitchChannel,
        kickChannel,
        youtubeChannel,
        veloraChannel,
        showPlatformBadge: getParam(searchParams, 'platformBadge') !== 'false',
        showPronouns: getParam(searchParams, 'pronouns') !== 'false' && hasTwitch,
        pridePronouns: getParam(searchParams, 'pridePronouns') === 'true',
        showBadges: getParam(searchParams, 'badges') !== 'false',
        showEmotes: getParam(searchParams, 'emotes') !== 'false',
        showHighlights: getParam(searchParams, 'highlights') !== 'false',
        showTimestamps: getParam(searchParams, 'timestamps') === 'true',
        showSharedChat: getParam(searchParams, 'shared') !== 'false' && hasTwitch,
        showNamePaints: getParam(searchParams, 'paints') !== 'false',
        playSound: getParam(searchParams, 'sound') === 'true',
        hideCommands: getParam(searchParams, 'hideCommands') === 'true',
        hideBots: getParam(searchParams, 'hideBots') === 'true',
        showReplies: getParam(searchParams, 'replies') !== 'false' && hasTwitch,
        maxMessages: parseInt(String(getParam(searchParams, 'maxMessages') || DEFAULT_CHAT_CONFIG.maxMessages), 10) || DEFAULT_CHAT_CONFIG.maxMessages,
        fontSize: parseInt(String(getParam(searchParams, 'fontSize') || DEFAULT_CHAT_CONFIG.fontSize), 10) || DEFAULT_CHAT_CONFIG.fontSize,
        fontFamily,
        fadeOutMessages: getParam(searchParams, 'fadeOut') === 'true',
        fadeOutDelay: parseInt(String(getParam(searchParams, 'fadeDelay') || DEFAULT_CHAT_CONFIG.fadeOutDelay), 10) || DEFAULT_CHAT_CONFIG.fadeOutDelay,
        emoteScale: parseFloat(String(getParam(searchParams, 'emoteScale') || DEFAULT_CHAT_CONFIG.emoteScale)) || DEFAULT_CHAT_CONFIG.emoteScale,
        blockedUsers: getParam(searchParams, 'blocked')
            ? String(getParam(searchParams, 'blocked'))
                .split(',')
                .map((s) => s.trim().toLowerCase())
                .filter(Boolean)
            : [],
        customBots: getParam(searchParams, 'bots')
            ? String(getParam(searchParams, 'bots'))
                .split(',')
                .map((s) => s.trim().toLowerCase())
                .filter(Boolean)
            : [],
        showRoomState: getParam(searchParams, 'roomState') === 'true' && hasTwitch,
        pageBackground,
        messageBgOpacity,
        textColor,
    };
};

export type ChatQueryInput = {
    platforms: ChatPlatform[];
    twitchChannel?: string;
    kickChannel?: string;
    youtubeChannel?: string;
    veloraChannel?: string;
    includePlatformsParam?: boolean;
    includeChannelParams?: boolean;
    showPlatformBadge?: boolean;
    showPronouns?: boolean;
    pridePronouns?: boolean;
    showBadges?: boolean;
    showEmotes?: boolean;
    showHighlights?: boolean;
    showTimestamps?: boolean;
    showSharedChat?: boolean;
    showNamePaints?: boolean;
    showReplies?: boolean;
    showRoomState?: boolean;
    hideCommands?: boolean;
    hideBots?: boolean;
    maxMessages?: number;
    fontFamily?: string;
    fontSize?: number;
    emoteScale?: number;
    fadeOutMessages?: boolean;
    fadeOutDelayMs?: number;
    playSound?: boolean;
    blockedUsers?: string;
    customBots?: string;
    pageBackground?: 'transparent' | 'dim' | 'dark';
    messageBgOpacity?: number;
    textColor?: string;
};

export const buildChatSearchParams = (input: ChatQueryInput): URLSearchParams => {
    const params = new URLSearchParams();
    const platforms = input.platforms.length > 0 ? input.platforms : DEFAULT_CHAT_CONFIG.platforms;
    const hasTwitch = platforms.includes('twitch');
    const includeChannelParams = input.includeChannelParams ?? platforms.length > 1;

    if (platforms.length > 1 || input.includePlatformsParam === true) {
        params.set('platforms', platforms.join(','));
    }

    if (includeChannelParams) {
        if (platforms.includes('twitch') && input.twitchChannel) params.set('twitch', input.twitchChannel);
        if (platforms.includes('kick') && input.kickChannel) params.set('kick', input.kickChannel);
        if (platforms.includes('youtube') && input.youtubeChannel) params.set('youtube', input.youtubeChannel);
        if (platforms.includes('velora') && input.veloraChannel) params.set('velora', input.veloraChannel);
    }
    if (input.showPlatformBadge === false) params.set('platformBadge', 'false');

    if (hasTwitch) {
        if (input.showPronouns === false) params.set('pronouns', 'false');
        if (input.showSharedChat === false) params.set('shared', 'false');
        if (input.showRoomState === true) params.set('roomState', 'true');
        if (input.showReplies === false) params.set('replies', 'false');
    }

    if (input.pridePronouns) params.set('pridePronouns', 'true');
    if (input.showBadges === false) params.set('badges', 'false');
    if (input.showEmotes === false) params.set('emotes', 'false');
    if (input.showHighlights === false) params.set('highlights', 'false');
    if (input.showTimestamps === true) params.set('timestamps', 'true');
    if (input.showNamePaints === false) params.set('paints', 'false');
    if (input.hideCommands === true) params.set('hideCommands', 'true');
    if (input.hideBots === true) params.set('hideBots', 'true');
    if (typeof input.maxMessages === 'number' && input.maxMessages !== DEFAULT_CHAT_CONFIG.maxMessages) {
        params.set('maxMessages', String(input.maxMessages));
    }
    if (typeof input.fontSize === 'number' && input.fontSize !== DEFAULT_CHAT_CONFIG.fontSize) {
        params.set('fontSize', String(input.fontSize));
    }
    if (typeof input.emoteScale === 'number' && input.emoteScale !== DEFAULT_CHAT_CONFIG.emoteScale) {
        params.set('emoteScale', String(input.emoteScale));
    }
    if (input.fadeOutMessages) {
        params.set('fadeOut', 'true');
        if (typeof input.fadeOutDelayMs === 'number' && input.fadeOutDelayMs !== DEFAULT_CHAT_CONFIG.fadeOutDelay) {
            params.set('fadeDelay', String(input.fadeOutDelayMs));
        }
    }
    if (input.playSound) params.set('sound', 'true');
    if (input.blockedUsers?.trim()) params.set('blocked', input.blockedUsers.trim());
    if (input.customBots?.trim()) params.set('bots', input.customBots.trim());
    if (input.fontFamily && input.fontFamily !== DEFAULT_CHAT_CONFIG.fontFamily) {
        params.set('font', input.fontFamily);
    }
    if (input.pageBackground && input.pageBackground !== DEFAULT_CHAT_CONFIG.pageBackground) {
        params.set('bg', input.pageBackground);
    }
    if (typeof input.messageBgOpacity === 'number') {
        const clamped = Number.isFinite(input.messageBgOpacity)
            ? Math.min(0.9, Math.max(0, input.messageBgOpacity))
            : 0;
        if (clamped > 0) params.set('msgBg', clamped.toFixed(2));
    }
    if (input.textColor && input.textColor.toLowerCase() !== DEFAULT_CHAT_CONFIG.textColor) {
        params.set('textColor', input.textColor);
    }

    return params;
};

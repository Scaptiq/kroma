/**
 * Message Types and Event Handling
 * Supports regular messages, subs, gifts, raids, announcements, etc.
 */

export type MessageType =
    | 'chat'           // Regular chat message
    | 'action'         // /me action message
    | 'sub'            // Subscription
    | 'resub'          // Re-subscription
    | 'subgift'        // Gift subscription
    | 'submysterygift' // Mystery gift (mass gift)
    | 'primepaidupgrade' // Prime to paid upgrade
    | 'giftpaidupgrade'  // Gift to paid upgrade
    | 'raid'           // Raid event
    | 'announcement'   // Channel announcement
    | 'firstmessage'   // First message in channel
    | 'highlighted'    // Highlighted message (redeemed with points)
    | 'reply'          // Reply to another message
    | 'cheer'          // Bits cheer
    | 'system';        // System message

export interface ParsedEmote {
    type: 'emote';
    url: string;
    name: string;
    provider: 'twitch' | 'kick' | '7tv' | 'bttv' | 'ffz' | 'youtube' | 'twemoji' | 'velora';
    isZeroWidth?: boolean;
    overlayEmote?: boolean;
}

export interface ParsedCheer {
    type: 'cheer';
    bits: number;
    prefix: string;
    color: string;
    url: string;
}

export type ParsedPart = string | ParsedEmote | ParsedCheer;

export interface ReplyInfo {
    parentMsgId: string;
    parentUserId: string;
    parentUserLogin: string;
    parentDisplayName: string;
    parentMsgBody: string;
}

export interface ChatMessage {
    id: string;
    username: string;
    displayName: string;
    userId: string;
    content: string;
    parsedContent: ParsedPart[];
    color: string;
    timestamp: number;

    // Message type and metadata
    type: MessageType;
    isAction: boolean;
    isFirstMessage: boolean;
    isHighlighted: boolean;

    // Badges
    badges: Array<{
        id: string;
        url: string;
        title: string;
        provider: 'twitch' | 'kick' | '7tv' | 'bttv' | 'ffz' | 'chatterino' | 'velora';
    }>;
    platform?: 'twitch' | 'kick' | 'youtube' | 'velora';
    kickBadges?: Array<{
        type: string;
        text?: string;
        count?: number;
        active?: boolean;
    }>;

    // Shared Chat
    isShared: boolean;
    sourceChannelName?: string;
    sourceRoomId?: string;
    sourceLogo?: string;
    avatarUrl?: string;

    // Pronouns
    pronouns?: string;
    pronounColor?: string;       // Badge background color
    pronounIsGradient?: boolean; // Whether color is a gradient

    // Name Paint (7TV)
    paint?: {
        background?: string;
        color?: string;
        filter?: string;
    };

    // Reply info
    reply?: ReplyInfo;

    // Bits/Cheer
    bits?: number;

    // Velora message effects
    effect?: 'glow' | 'galaxy' | 'rainbow' | 'gigantify' | string;
    effectVariant?: string;
    effectColor?: string;

    // Sub info (for sub messages)
    subInfo?: {
        months: number;
        tier: '1000' | '2000' | '3000' | 'Prime';
        isPrime: boolean;
        giftCount?: number;
        recipientDisplayName?: string;
    };

    // Raid info
    raidInfo?: {
        displayName: string;
        viewerCount: number;
    };

    // Velora card payloads (e.g., gift celebrations)
    veloraCard?: {
        type: string;
        payload?: any;
    };

    // Velora accent color (channel/user)
    accentColor?: string;
}

export interface SubTier {
    id: '1000' | '2000' | '3000' | 'Prime';
    name: string;
    color: string;
}

export const SUB_TIERS: { [key: string]: SubTier } = {
    '1000': { id: '1000', name: 'Tier 1', color: '#9147ff' },
    '2000': { id: '2000', name: 'Tier 2', color: '#00ff7f' },
    '3000': { id: '3000', name: 'Tier 3', color: '#ff6b6b' },
    'Prime': { id: 'Prime', name: 'Prime', color: '#00a8e8' },
};

// Cheer tier colors and thresholds
export const CHEER_TIERS = [
    { min: 10000, color: '#f43b47', name: 'red' },
    { min: 5000, color: '#0099fe', name: 'blue' },
    { min: 1000, color: '#1db2a6', name: 'green' },
    { min: 100, color: '#9c3ee8', name: 'purple' },
    { min: 1, color: '#979797', name: 'gray' },
];

export function getCheerTierColor(bits: number): string {
    for (const tier of CHEER_TIERS) {
        if (bits >= tier.min) {
            return tier.color;
        }
    }
    return CHEER_TIERS[CHEER_TIERS.length - 1].color;
}

/**
 * Check if this is a "special" message type that should stand out
 */
export function isSpecialMessage(msg: ChatMessage): boolean {
    return msg.type !== 'chat' && msg.type !== 'action' && msg.type !== 'reply';
}

/**
 * Get background color for special message types
 */
export function getMessageBackgroundColor(msg: ChatMessage): string | null {
    switch (msg.type) {
        case 'sub':
        case 'resub':
            return 'rgba(145, 71, 255, 0.3)'; // Twitch purple
        case 'subgift':
        case 'submysterygift':
            return 'rgba(0, 200, 127, 0.3)'; // Gift green
        case 'raid':
            return 'rgba(255, 107, 107, 0.3)'; // Raid red
        case 'announcement':
            return 'rgba(0, 168, 232, 0.3)'; // Announcement blue
        case 'highlighted':
            return 'rgba(255, 215, 0, 0.2)'; // Gold highlight
        case 'cheer':
            return msg.bits ? `${getCheerTierColor(msg.bits)}33` : null;
        default:
            return null;
    }
}

/**
 * Zero-width emote codes that should overlay the previous emote
 */
export const ZERO_WIDTH_EMOTES = new Set([
    'SoSnowy', 'IceCold', 'SantaHat', 'TopHat', 'ReinDeer', 'CandyCane',
    'cvMask', 'cvHazmat',
    // 7TV Zero-width
    'PETTHE', 'WAYTOODANK', 'HYPERS', 'HYPERDANSGAME', 'NOOO',
]);

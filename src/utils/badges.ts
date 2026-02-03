/**
 * Badge Fetching Utilities
 * Supports: Twitch, 7TV, FFZ
 */

export interface Badge {
    id: string;
    title: string;
    url: string;
    provider: 'twitch' | '7tv' | 'ffz';
}

// Cache for Twitch badge sets
const globalBadgeCache = new Map<string, string>(); // badge/version -> url
const channelBadgeCache = new Map<string, Map<string, string>>(); // channelId -> badge/version -> url

// 7TV badges cache (global list + user lookups)
let global7TVBadges: Map<string, any> | null = null;
let badges7TVFetchPromise: Promise<Map<string, any>> | null = null;
const user7TVBadgeCache = new Map<string, Badge | null>(); // key -> badge

// FFZ badges cache
const ffzBadgeCache = new Map<string, Badge[]>(); // userId -> badges

let globalBadgesFetched = false;

/**
 * Fetch global Twitch badges
 */
export async function fetchGlobalTwitchBadges(): Promise<void> {
    if (globalBadgesFetched) return;

    try {
        const res = await fetch('https://api.ivr.fi/v2/twitch/badges/global');
        if (!res.ok) return;

        const data = await res.json();

        if (Array.isArray(data)) {
            data.forEach((set: any) => {
                if (set.versions && Array.isArray(set.versions)) {
                    set.versions.forEach((version: any) => {
                        const key = `${set.set_id}/${version.id}`;
                        globalBadgeCache.set(key, version.image_url_1x || version.image_url_2x);
                    });
                }
            });
        }

        globalBadgesFetched = true;
        console.log(`🏅 Loaded ${globalBadgeCache.size} global Twitch badges`);
    } catch (e) {
        console.error('Failed to fetch global Twitch badges:', e);
    }
}

/**
 * Fetch channel-specific Twitch badges
 */
export async function fetchChannelTwitchBadges(channelId: string): Promise<void> {
    if (channelBadgeCache.has(channelId)) return;

    const channelBadges = new Map<string, string>();

    try {
        const res = await fetch(`https://api.ivr.fi/v2/twitch/badges/channel?id=${channelId}`);
        if (!res.ok) {
            channelBadgeCache.set(channelId, channelBadges);
            return;
        }

        const data = await res.json();

        if (Array.isArray(data)) {
            data.forEach((set: any) => {
                if (set.versions && Array.isArray(set.versions)) {
                    set.versions.forEach((version: any) => {
                        const key = `${set.set_id}/${version.id}`;
                        channelBadges.set(key, version.image_url_1x || version.image_url_2x);
                    });
                }
            });
        }

        channelBadgeCache.set(channelId, channelBadges);
        console.log(`🏅 Loaded ${channelBadges.size} channel badges`);
    } catch (e) {
        console.error('Failed to fetch channel badges:', e);
        channelBadgeCache.set(channelId, channelBadges);
    }
}

/**
 * Get badge URL from cache
 */
export function getTwitchBadgeUrl(name: string, version: string, channelId?: string): string | null {
    const key = `${name}/${version}`;

    // Check channel badges first (they override global)
    if (channelId && channelBadgeCache.has(channelId)) {
        const channelBadges = channelBadgeCache.get(channelId)!;
        if (channelBadges.has(key)) {
            return channelBadges.get(key)!;
        }
    }

    // Fallback to global badges
    if (globalBadgeCache.has(key)) {
        return globalBadgeCache.get(key)!;
    }

    return null;
}

/**
 * Fetch all 7TV badges via GraphQL (similar to paints)
 */
async function fetchGlobal7TVBadges(): Promise<Map<string, any>> {
    if (global7TVBadges) return global7TVBadges;
    if (badges7TVFetchPromise) return badges7TVFetchPromise;

    badges7TVFetchPromise = (async () => {
        try {
            const query = `query{cosmetics{badges{id name tooltip host{url files{name}}}}}`;
            const res = await fetch("https://7tv.io/v3/gql", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query })
            });

            if (!res.ok) {
                console.error("Failed to fetch 7TV badges");
                return new Map();
            }

            const data = await res.json();
            const badges = data?.data?.cosmetics?.badges || [];

            const badgeMap = new Map<string, any>();
            for (const badge of badges) {
                badgeMap.set(badge.id, badge);
            }

            global7TVBadges = badgeMap;
            console.log(`🏅 Loaded ${badgeMap.size} 7TV badges`);
            return badgeMap;
        } catch (e) {
            console.error("Error fetching 7TV badges:", e);
            return new Map();
        }
    })();

    return badges7TVFetchPromise;
}

/**
 * Preload 7TV badges (call on init)
 */
export async function preload7TVBadges(): Promise<void> {
    await fetchGlobal7TVBadges();
}

/**
 * Fetch 7TV badge for a user
 */
export async function fetch7TVUserBadges(
    userId: string,
    platform: 'twitch' | 'kick' = 'twitch'
): Promise<Badge[]> {
    const cacheKey = `${platform}:${userId}`;
    // Check cache
    if (user7TVBadgeCache.has(cacheKey)) {
        const cached = user7TVBadgeCache.get(cacheKey);
        return cached ? [cached] : [];
    }

    try {
        // Ensure global badges are loaded
        const allBadges = await fetchGlobal7TVBadges();

        // Fetch user data
        const res = await fetch(`https://7tv.io/v3/users/${platform}/${userId}`);
        if (!res.ok) {
            user7TVBadgeCache.set(cacheKey, null);
            return [];
        }

        const data = await res.json();

        // Check for badge_id in user.style
        const badgeId = data.user?.style?.badge_id;
        if (badgeId && allBadges.has(badgeId)) {
            const badgeData = allBadges.get(badgeId);
            const badge: Badge = {
                id: badgeId,
                title: badgeData.tooltip || badgeData.name || '7TV Badge',
                url: badgeData.host?.url
                    ? `https:${badgeData.host.url}/${badgeData.host.files?.[0]?.name || '1x.webp'}`
                    : '',
                provider: '7tv'
            };
            user7TVBadgeCache.set(cacheKey, badge);
            return [badge];
        }

        user7TVBadgeCache.set(cacheKey, null);
        return [];
    } catch (e) {
        user7TVBadgeCache.set(cacheKey, null);
        return [];
    }
}

/**
 * Fetch FFZ badges for a user
 */
export async function fetchFFZUserBadges(userId: string): Promise<Badge[]> {
    if (ffzBadgeCache.has(userId)) {
        return ffzBadgeCache.get(userId)!;
    }

    try {
        const res = await fetch(`https://api.frankerfacez.com/v1/user/id/${userId}`);
        if (!res.ok) {
            ffzBadgeCache.set(userId, []);
            return [];
        }

        const data = await res.json();
        const badges: Badge[] = [];

        if (data.badges && Array.isArray(data.badges)) {
            data.badges.forEach((badge: any) => {
                const url = badge.urls?.['1'] || badge.urls?.['2'] || '';
                if (url) {
                    badges.push({
                        id: String(badge.id),
                        title: badge.title || 'FFZ Badge',
                        url: url.startsWith('//') ? `https:${url}` : url,
                        provider: 'ffz'
                    });
                }
            });
        }

        ffzBadgeCache.set(userId, badges);
        return badges;
    } catch (e) {
        ffzBadgeCache.set(userId, []);
        return [];
    }
}

/**
 * Get all badges for a user (Twitch + third-party)
 */
export async function getAllUserBadges(
    twitchBadges: { [key: string]: string | undefined } | undefined,
    userId: string,
    channelId?: string
): Promise<Badge[]> {
    const badges: Badge[] = [];

    // Add Twitch badges
    if (twitchBadges) {
        Object.entries(twitchBadges).forEach(([name, version]) => {
            if (!version) return;
            const url = getTwitchBadgeUrl(name, String(version), channelId);
            if (url) {
                badges.push({
                    id: `twitch-${name}-${version}`,
                    title: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                    url,
                    provider: 'twitch'
                });
            }
        });
    }

    // Fetch third-party badges in parallel
    const [sevenTVBadges, ffzBadges] = await Promise.all([
        fetch7TVUserBadges(userId),
        fetchFFZUserBadges(userId)
    ]);

    badges.push(...sevenTVBadges, ...ffzBadges);

    return badges;
}

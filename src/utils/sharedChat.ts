// Utility functions for Twitch Shared Chat support
// Caches channel info by room ID for performance

interface ChannelInfo {
    id: string;
    login: string;
    displayName: string;
    logo: string;
}

const channelCache = new Map<string, ChannelInfo | null>();
const pendingRequests = new Map<string, Promise<ChannelInfo | null>>();

/**
 * Get channel information from a room ID using IVR.fi API
 * This is useful for resolving the source channel in shared chat
 */
export async function getChannelByRoomId(roomId: string): Promise<ChannelInfo | null> {
    if (channelCache.has(roomId)) {
        return channelCache.get(roomId) || null;
    }

    // If there's already a pending request for this roomId, wait for it
    if (pendingRequests.has(roomId)) {
        return pendingRequests.get(roomId)!;
    }

    const promise = (async () => {
        try {
            // Using IVR.fi API to get channel info from ID
            const res = await fetch(`https://api.ivr.fi/v2/twitch/user?id=${roomId}`);
            if (!res.ok) {
                channelCache.set(roomId, null);
                return null;
            }
            const data = await res.json();

            // IVR.fi returns an array
            if (Array.isArray(data) && data.length > 0) {
                const channel = data[0];
                const info: ChannelInfo = {
                    id: channel.id,
                    login: channel.login,
                    displayName: channel.displayName || channel.login,
                    logo: channel.logo
                };
                channelCache.set(roomId, info);
                return info;
            }

            channelCache.set(roomId, null);
            return null;
        } catch (e) {
            console.error("Failed to fetch channel info for room ID:", roomId, e);
            channelCache.set(roomId, null);
            return null;
        } finally {
            pendingRequests.delete(roomId);
        }
    })();

    pendingRequests.set(roomId, promise);
    return promise;
}

/**
 * Parse source-badges from the IRC tag string format
 * Format: "badge/version,badge/version,..."
 */
export function parseSourceBadges(sourceBadges: string | undefined): { [key: string]: string } | undefined {
    if (!sourceBadges) return undefined;

    const badges: { [key: string]: string } = {};
    const parts = sourceBadges.split(',');

    for (const part of parts) {
        const [name, version] = part.split('/');
        if (name && version !== undefined) {
            badges[name] = version;
        }
    }

    return Object.keys(badges).length > 0 ? badges : undefined;
}

/**
 * Pre-cache a channel by username (useful when we know the channel we're joining)
 */
export async function cacheChannelByUsername(username: string): Promise<ChannelInfo | null> {
    try {
        const res = await fetch(`https://api.ivr.fi/v2/twitch/user?login=${username}`);
        if (!res.ok) return null;

        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
            const channel = data[0];
            const info: ChannelInfo = {
                id: channel.id,
                login: channel.login,
                displayName: channel.displayName || channel.login,
                logo: channel.logo
            };
            channelCache.set(channel.id, info);
            return info;
        }
        return null;
    } catch (e) {
        console.error("Failed to pre-cache channel by username:", username, e);
        return null;
    }
}

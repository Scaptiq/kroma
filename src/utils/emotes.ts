export interface Emote {
    code: string;
    url: string;
    provider: 'twitch' | '7tv' | 'bttv' | 'ffz';
}

export async function getTwitchEmoteUrl(id: string): Promise<string> {
    return `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/1.0`;
}

export async function fetch7TVGlobalEmotes(): Promise<Emote[]> {
    try {
        const res = await fetch("https://7tv.io/v3/emote-sets/global");
        if (!res.ok) return [];
        const data = await res.json();
        return data.emotes.map((e: any) => ({
            code: e.name,
            url: `https://cdn.7tv.app/emote/${e.id}/1x.webp`,
            provider: '7tv'
        }));
    } catch {
        return [];
    }
}

export async function fetch7TVChannelEmotes(
    channelId: string,
    platform: 'twitch' | 'kick' | 'youtube' = 'twitch'
): Promise<Emote[]> {
    try {
        const res = await fetch(`https://7tv.io/v3/users/${platform}/${channelId}`);
        if (!res.ok) return [];
        const data = await res.json();

        const set = data.emote_set || data.user?.emote_set;

        if (!set?.emotes) return [];
        return set.emotes.map((e: any) => ({
            code: e.name,
            url: `https://cdn.7tv.app/emote/${e.id}/1x.webp`,
            provider: '7tv'
        }));
    } catch {
        return [];
    }
}

// BTTV (BetterTTV) Emotes
export async function fetchBTTVGlobalEmotes(): Promise<Emote[]> {
    try {
        const res = await fetch("https://api.betterttv.net/3/cached/emotes/global");
        if (!res.ok) return [];
        const data = await res.json();
        return data.map((e: any) => ({
            code: e.code,
            url: `https://cdn.betterttv.net/emote/${e.id}/1x`,
            provider: 'bttv'
        }));
    } catch {
        return [];
    }
}

export async function fetchBTTVChannelEmotes(channelId: string): Promise<Emote[]> {
    try {
        const res = await fetch(`https://api.betterttv.net/3/cached/users/twitch/${channelId}`);
        if (!res.ok) return [];
        const data = await res.json();

        const emotes: Emote[] = [];

        // Channel emotes
        if (data.channelEmotes) {
            data.channelEmotes.forEach((e: any) => {
                emotes.push({
                    code: e.code,
                    url: `https://cdn.betterttv.net/emote/${e.id}/1x`,
                    provider: 'bttv'
                });
            });
        }

        // Shared emotes (from other channels via BTTV)
        if (data.sharedEmotes) {
            data.sharedEmotes.forEach((e: any) => {
                emotes.push({
                    code: e.code,
                    url: `https://cdn.betterttv.net/emote/${e.id}/1x`,
                    provider: 'bttv'
                });
            });
        }

        return emotes;
    } catch {
        return [];
    }
}

// FFZ (FrankerFaceZ) Emotes
export async function fetchFFZGlobalEmotes(): Promise<Emote[]> {
    try {
        const res = await fetch("https://api.frankerfacez.com/v1/set/global");
        if (!res.ok) return [];
        const data = await res.json();

        const emotes: Emote[] = [];
        // FFZ global sets are indexed by set ID
        if (data.sets) {
            Object.values(data.sets).forEach((set: any) => {
                if (set.emoticons) {
                    set.emoticons.forEach((e: any) => {
                        // FFZ provides multiple sizes, prefer 1 (small)
                        const url = e.urls["1"] || e.urls["2"] || e.urls["4"];
                        if (url) {
                            emotes.push({
                                code: e.name,
                                url: url.startsWith("//") ? `https:${url}` : url,
                                provider: 'ffz'
                            });
                        }
                    });
                }
            });
        }

        return emotes;
    } catch {
        return [];
    }
}

export async function fetchFFZChannelEmotes(channelName: string): Promise<Emote[]> {
    try {
        const res = await fetch(`https://api.frankerfacez.com/v1/room/${channelName}`);
        if (!res.ok) return [];
        const data = await res.json();

        const emotes: Emote[] = [];
        // FFZ channel response has sets indexed by set ID
        if (data.sets) {
            Object.values(data.sets).forEach((set: any) => {
                if (set.emoticons) {
                    set.emoticons.forEach((e: any) => {
                        const url = e.urls["1"] || e.urls["2"] || e.urls["4"];
                        if (url) {
                            emotes.push({
                                code: e.name,
                                url: url.startsWith("//") ? `https:${url}` : url,
                                provider: 'ffz'
                            });
                        }
                    });
                }
            });
        }

        return emotes;
    } catch {
        return [];
    }
}

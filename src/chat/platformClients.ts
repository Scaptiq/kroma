const fetchJson = async (url: string) => {
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        return null;
    }
};

export const fetchKickChannelData = (channel: string) =>
    fetchJson(`/api/kick?channel=${encodeURIComponent(channel)}`);

export const fetchYouTubeLiveChat = (channel: string) =>
    fetchJson(`/api/youtube?channel=${encodeURIComponent(channel)}`);

export const fetchYouTubeMessages = (liveChatId: string, pageToken?: string | null) => {
    const params = new URLSearchParams();
    params.set('liveChatId', liveChatId);
    if (pageToken) params.set('pageToken', pageToken);
    return fetchJson(`/api/youtube/messages?${params.toString()}`);
};

export const resolveVeloraUser = (username: string) =>
    fetchJson(`/api/velora/resolve?username=${encodeURIComponent(username)}`);

export const fetchVeloraBadgesCatalog = () =>
    fetchJson(`/api/velora/badges/catalog`);

export const fetchVeloraBadgesForChannel = (username: string) =>
    fetchJson(`/api/velora/badges/channel?username=${encodeURIComponent(username)}`);

export const fetchVeloraEmotes = (channelId: string) =>
    fetchJson(`/api/velora/emotes?channelId=${encodeURIComponent(channelId)}`);

export const resolveVeloraEmotes = (codes: string[]) =>
    fetchJson(`/api/velora/emotes/resolve?codes=${encodeURIComponent(codes.join(','))}`);

export const fetchVeloraHistory = (channelId: string) =>
    fetchJson(`/api/velora/history?channelId=${encodeURIComponent(channelId)}`);

export const fetchTwitchUserByLogin = (login: string) =>
    fetchJson(`https://api.ivr.fi/v2/twitch/user?login=${encodeURIComponent(login)}`);

import { json } from "solid-start";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

const getApiKey = () => process.env.YOUTUBE_API_KEY || "";

const normalizeChannelInput = (input: string) => {
    let value = input.trim();
    if (!value) return "";

    if (value.startsWith("http")) {
        try {
            const url = new URL(value);
            value = url.pathname.replace(/^\/+/, "");
        } catch {
            // ignore
        }
    }

    value = value.replace(/^@/, "");
    value = value.replace(/^channel\//, "");
    value = value.replace(/^user\//, "");
    return value;
};

const fetchJson = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
};

export async function GET({ request }: { request: Request }) {
    const url = new URL(request.url);
    const channelInput = url.searchParams.get("channel");

    if (!channelInput) {
        return json({ error: "Missing channel" }, { status: 400 });
    }

    const apiKey = getApiKey();
    if (!apiKey) {
        return json({ error: "Missing YOUTUBE_API_KEY" }, { status: 500 });
    }

    const normalized = normalizeChannelInput(channelInput);
    if (!normalized) {
        return json({ error: "Invalid channel" }, { status: 400 });
    }

    let channelId = "";

    if (normalized.startsWith("UC") && normalized.length >= 10) {
        channelId = normalized;
    } else {
        const handleLookup = await fetchJson(
            `${YOUTUBE_API_BASE}/channels?part=id&forHandle=${encodeURIComponent(normalized)}&key=${apiKey}`
        );
        channelId = handleLookup?.items?.[0]?.id || "";

        if (!channelId) {
            const searchLookup = await fetchJson(
                `${YOUTUBE_API_BASE}/search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(normalized)}&key=${apiKey}`
            );
            channelId = searchLookup?.items?.[0]?.snippet?.channelId || "";
        }
    }

    if (!channelId) {
        return json({ error: "Channel not found" }, { status: 404 });
    }

    const liveSearch = await fetchJson(
        `${YOUTUBE_API_BASE}/search?part=snippet&channelId=${encodeURIComponent(channelId)}&eventType=live&type=video&maxResults=1&key=${apiKey}`
    );
    const liveVideoId = liveSearch?.items?.[0]?.id?.videoId || "";

    if (!liveVideoId) {
        return json({
            channelId,
            liveVideoId: null,
            liveChatId: null,
            status: "offline"
        });
    }

    const liveDetails = await fetchJson(
        `${YOUTUBE_API_BASE}/videos?part=liveStreamingDetails&id=${encodeURIComponent(liveVideoId)}&key=${apiKey}`
    );
    const liveChatId = liveDetails?.items?.[0]?.liveStreamingDetails?.activeLiveChatId || null;

    return json({
        channelId,
        liveVideoId,
        liveChatId,
        status: liveChatId ? "live" : "unavailable"
    });
}

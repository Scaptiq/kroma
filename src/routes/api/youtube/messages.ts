import { json, type APIEvent } from "solid-start";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

const getApiKey = (event?: APIEvent) =>
    (event as any)?.env?.YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY || "";

export async function GET(event: APIEvent) {
    const url = new URL(event.request.url);
    const liveChatId = url.searchParams.get("liveChatId");
    const pageToken = url.searchParams.get("pageToken");

    if (!liveChatId) {
        return json({ error: "Missing liveChatId" }, { status: 400 });
    }

    const apiKey = getApiKey(event);
    if (!apiKey) {
        return json({ error: "Missing YOUTUBE_API_KEY" }, { status: 500 });
    }

    const params = new URLSearchParams();
    params.set("part", "snippet,authorDetails");
    params.set("liveChatId", liveChatId);
    params.set("maxResults", "200");
    params.set("key", apiKey);
    if (pageToken) params.set("pageToken", pageToken);

    try {
        const res = await fetch(`${YOUTUBE_API_BASE}/liveChat/messages?${params.toString()}`);
        if (!res.ok) {
            return json({ error: "Failed to fetch messages" }, { status: res.status });
        }
        const data = await res.json();
        return json(data);
    } catch (e) {
        return json({ error: "Failed to fetch messages" }, { status: 500 });
    }
}

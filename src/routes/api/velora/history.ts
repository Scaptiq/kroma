import { json, type APIEvent } from "solid-start";

const VELORA_API_BASE = "https://api.velora.tv";

const getAccessToken = (event?: APIEvent) =>
    (event as any)?.env?.VELORA_ACCESS_TOKEN || process.env.VELORA_ACCESS_TOKEN || "";

const buildHeaders = (event?: APIEvent) => {
    const headers: Record<string, string> = {
        Accept: "application/json",
        "User-Agent": "kroma-chat",
    };
    const token = getAccessToken(event);
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    return headers;
};

const safeReadBody = async (res: Response) => {
    try {
        const text = await res.text();
        if (!text) return null;
        try {
            return JSON.parse(text);
        } catch {
            return text.slice(0, 500);
        }
    } catch {
        return null;
    }
};

export async function GET(event: APIEvent) {
    const url = new URL(event.request.url);
    const channelId = url.searchParams.get("channelId");
    const cursor = url.searchParams.get("cursor");

    if (!channelId) {
        return json({ error: "Missing channelId" }, { status: 400 });
    }

    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    params.set("limit", "100");

    try {
        const res = await fetch(
            `${VELORA_API_BASE}/api/chat/channels/${encodeURIComponent(channelId)}/history?${params.toString()}`,
            { headers: buildHeaders(event) }
        );

        if (!res.ok) {
            return json(
                { error: "Failed to fetch chat history", status: res.status, details: await safeReadBody(res) },
                { status: res.status }
            );
        }

        const data = await res.json();
        return json(data);
    } catch (e) {
        return json({ error: "Failed to fetch chat history" }, { status: 500 });
    }
}

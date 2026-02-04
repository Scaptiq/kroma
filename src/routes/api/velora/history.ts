import { json } from "solid-start";

const VELORA_API_BASE = "https://api.velora.tv";

export async function GET({ request }: { request: Request }) {
    const url = new URL(request.url);
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
            `${VELORA_API_BASE}/api/chat/channels/${encodeURIComponent(channelId)}/history?${params.toString()}`
        );

        if (!res.ok) {
            return json({ error: "Failed to fetch chat history" }, { status: res.status });
        }

        const data = await res.json();
        return json(data);
    } catch (e) {
        return json({ error: "Failed to fetch chat history" }, { status: 500 });
    }
}

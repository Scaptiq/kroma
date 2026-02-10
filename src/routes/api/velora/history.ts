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

    const headers = buildHeaders(event);
    const fetchHistory = async (id: string) =>
        fetch(
            `${VELORA_API_BASE}/api/chat/channels/${encodeURIComponent(id)}/history?${params.toString()}`,
            { headers }
        );

    const resolveChannelId = async (usernameOrId: string): Promise<string | null> => {
        try {
            const userRes = await fetch(
                `${VELORA_API_BASE}/api/users/${encodeURIComponent(usernameOrId.trim().replace(/^@/, "").toLowerCase())}`,
                { headers }
            );
            if (!userRes.ok) return null;
            const userData = await userRes.json();
            const id =
                userData?.id ||
                userData?.userId ||
                userData?.raw?.id ||
                userData?.user?.id;
            return id ? String(id) : null;
        } catch {
            return null;
        }
    };

    try {
        let res = await fetchHistory(channelId);

        // Username-based input can fail on some history endpoints that expect numeric/user IDs.
        if (!res.ok && res.status === 404) {
            const resolvedId = await resolveChannelId(channelId);
            if (resolvedId && resolvedId !== channelId) {
                res = await fetchHistory(resolvedId);
            }
        }

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

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

export async function GET(event: APIEvent) {
    const url = new URL(event.request.url);
    const username = url.searchParams.get("username");

    if (!username) {
        return json({ error: "Missing username" }, { status: 400 });
    }

    try {
        const res = await fetch(
            `${VELORA_API_BASE}/api/badges/channel/${encodeURIComponent(username)}`,
            { headers: buildHeaders(event) }
        );
        if (!res.ok) {
            const text = await res.text();
            return json({ error: "Failed to fetch channel badges", details: text }, { status: res.status });
        }
        const data = await res.json();
        return json(data);
    } catch (e) {
        return json({ error: "Failed to fetch channel badges" }, { status: 500 });
    }
}

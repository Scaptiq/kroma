import { json, type APIEvent } from "solid-start";

const VELORA_API_BASE = "https://api.velora.tv";

const normalizeUsername = (input: string) =>
    input.trim().replace(/^@/, "").toLowerCase();

const extractUserList = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.users)) return data.users;
    return [];
};

const pickBestMatch = (users: any[], username: string) => {
    const normalized = normalizeUsername(username);
    const exact = users.find((user) => {
        const handle = String(user?.username || user?.handle || user?.slug || "").toLowerCase();
        return handle === normalized;
    });
    return exact || users[0] || null;
};

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
    const username = url.searchParams.get("username");

    if (!username) {
        return json({ error: "Missing username" }, { status: 400 });
    }

    try {
        const headers = buildHeaders(event);
        const queries = [
            `${VELORA_API_BASE}/api/search/users?q=${encodeURIComponent(username)}`,
            `${VELORA_API_BASE}/api/search?q=${encodeURIComponent(username)}&type=users`,
        ];

        let lastError: { status: number; body: any } | null = null;
        for (const endpoint of queries) {
            const res = await fetch(endpoint, { headers });
            if (!res.ok) {
                lastError = { status: res.status, body: await safeReadBody(res) };
                continue;
            }
            const data = await res.json();
            const users = extractUserList(data);
            const match = pickBestMatch(users, username);
            if (match) {
                const userId =
                    match?.id || match?.userId || match?.uuid || match?._id || match?.user?.id;
                const resolvedUsername =
                    match?.username || match?.handle || match?.slug || match?.user?.username || username;
                const displayName =
                    match?.displayName || match?.display_name || match?.name || match?.user?.displayName || resolvedUsername;

                return json({
                    userId: userId ? String(userId) : null,
                    username: String(resolvedUsername),
                    displayName: String(displayName),
                    raw: match,
                });
            }
        }

        if (lastError) {
            return json(
                { error: "Failed to search users", status: lastError.status, details: lastError.body },
                { status: lastError.status }
            );
        }

        return json({ error: "User not found" }, { status: 404 });
    } catch (e) {
        return json({ error: "Failed to resolve user" }, { status: 500 });
    }
}

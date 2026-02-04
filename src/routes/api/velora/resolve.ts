import { json } from "solid-start";

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

export async function GET({ request }: { request: Request }) {
    const url = new URL(request.url);
    const username = url.searchParams.get("username");

    if (!username) {
        return json({ error: "Missing username" }, { status: 400 });
    }

    try {
        const res = await fetch(
            `${VELORA_API_BASE}/api/search/users?q=${encodeURIComponent(username)}`
        );

        if (!res.ok) {
            return json({ error: "Failed to search users" }, { status: res.status });
        }

        const data = await res.json();
        const users = extractUserList(data);
        const match = pickBestMatch(users, username);

        if (!match) {
            return json({ error: "User not found" }, { status: 404 });
        }

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
    } catch (e) {
        return json({ error: "Failed to resolve user" }, { status: 500 });
    }
}

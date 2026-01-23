export async function getTwitchUserId(username: string): Promise<string | null> {
    try {
        const res = await fetch(`https://api.ivr.fi/v2/twitch/user?login=${username}`);
        if (!res.ok) return null;
        const data = await res.json();
        // ivr.fi returns an array for search
        return data[0]?.id || null;
    } catch (e) {
        console.error("Failed to resolve Twitch ID:", e);
        return null;
    }
}

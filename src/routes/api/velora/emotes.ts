import { json } from "solid-start";

const VELORA_API_BASE = "https://api.velora.tv";

const extractEmotes = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.emotes)) return data.emotes;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    return [];
};

const normalizeEmote = (emote: any) => {
    const code =
        emote?.code ||
        emote?.name ||
        emote?.text ||
        emote?.shortcode ||
        emote?.shortCode ||
        emote?.id;
    const url =
        emote?.url ||
        emote?.imageUrl ||
        emote?.image_url ||
        emote?.image ||
        emote?.src ||
        emote?.images?.full ||
        emote?.images?.fullsize ||
        emote?.images?.original ||
        emote?.images?.large ||
        emote?.images?.medium ||
        emote?.images?.small;
    if (!code || !url) return null;
    return { code: String(code), url: String(url) };
};

export async function GET({ request }: { request: Request }) {
    const url = new URL(request.url);
    const channelId = url.searchParams.get("channelId");

    try {
        const [globalRes, channelRes] = await Promise.all([
            fetch(`${VELORA_API_BASE}/api/emotes/global`),
            channelId
                ? fetch(`${VELORA_API_BASE}/api/emotes/channel/${encodeURIComponent(channelId)}`)
                : Promise.resolve(null),
        ]);

        const globalData = globalRes && globalRes.ok ? await globalRes.json() : null;
        const channelData = channelRes && channelRes.ok ? await channelRes.json() : null;

        const globalEmotes = extractEmotes(globalData)
            .map(normalizeEmote)
            .filter(Boolean);
        const channelEmotes = extractEmotes(channelData)
            .map(normalizeEmote)
            .filter(Boolean);

        return json({
            global: globalEmotes,
            channel: channelEmotes,
        });
    } catch (e) {
        return json({ error: "Failed to fetch emotes" }, { status: 500 });
    }
}

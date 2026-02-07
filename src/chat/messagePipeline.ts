import type { Emote } from "~/utils/emotes";
import type { ParsedPart } from "~/utils/messageTypes";
import { ZERO_WIDTH_EMOTES } from "~/utils/messageTypes";

export type EmoteSources = {
    global7TV: Emote[];
    channel7TV: Emote[];
    channel7TVKick: Emote[];
    channel7TVYouTube: Emote[];
    globalBTTV: Emote[];
    channelBTTV: Emote[];
    globalFFZ: Emote[];
    channelFFZ: Emote[];
};

export type EmoteFinder = (code: string, platform?: 'twitch' | 'kick' | 'youtube') => Emote | null;

export const createEmoteFinder = (sources: EmoteSources): EmoteFinder => (code, platform = 'twitch') => {
    if (platform === 'kick') {
        return (
            sources.channel7TVKick.find((e) => e.code === code) ||
            sources.global7TV.find((e) => e.code === code) ||
            null
        );
    }

    if (platform === 'youtube') {
        return (
            sources.channel7TVYouTube.find((e) => e.code === code) ||
            sources.global7TV.find((e) => e.code === code) ||
            null
        );
    }

    return (
        sources.channel7TV.find((e) => e.code === code) ||
        sources.channelBTTV.find((e) => e.code === code) ||
        sources.channelFFZ.find((e) => e.code === code) ||
        sources.global7TV.find((e) => e.code === code) ||
        sources.globalBTTV.find((e) => e.code === code) ||
        sources.globalFFZ.find((e) => e.code === code) ||
        null
    );
};

export const parseTwitchMessageContent = (
    text: string,
    twitchEmotes: { [id: string]: string[] } | undefined,
    showEmotes: boolean,
    findEmote: EmoteFinder,
    platform: 'twitch' | 'kick' | 'youtube' = 'twitch'
): ParsedPart[] => {
    let parts: { start: number; end: number; type: 'emote'; content: ParsedPart }[] = [];

    if (twitchEmotes && showEmotes) {
        Object.entries(twitchEmotes).forEach(([id, ranges]) => {
            ranges.forEach((range) => {
                const [start, end] = range.split("-").map(Number);
                const emoteName = text.substring(start, end + 1);
                parts.push({
                    start,
                    end: end + 1,
                    type: "emote",
                    content: {
                        type: "emote",
                        url: `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/2.0`,
                        name: emoteName,
                        provider: 'twitch'
                    }
                });
            });
        });
    }

    parts.sort((a, b) => a.start - b.start);

    const finalParts: ParsedPart[] = [];
    let cursor = 0;

    const processTextChunk = (chunk: string) => {
        if (!chunk) return;

        const words = chunk.split(/(\s+)/);

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const trimmed = word.trim();

            if (!trimmed) {
                finalParts.push(word);
                continue;
            }

            if (showEmotes) {
                const emote = findEmote(trimmed, platform);
                if (emote) {
                    const isZeroWidth = ZERO_WIDTH_EMOTES.has(trimmed);
                    finalParts.push({
                        type: "emote",
                        url: emote.url,
                        name: emote.code,
                        provider: emote.provider,
                        isZeroWidth
                    });
                    continue;
                }
            }

            finalParts.push(word);
        }
    };

    parts.forEach((part) => {
        if (part.start > cursor) {
            processTextChunk(text.substring(cursor, part.start));
        }
        finalParts.push(part.content);
        cursor = part.end;
    });

    if (cursor < text.length) {
        processTextChunk(text.substring(cursor));
    }

    return finalParts.filter((p) => p !== "");
};

const emojiToTwemojiUrl = (emoji: string) => {
    const codepoints = Array.from(emoji)
        .map((char) => char.codePointAt(0)?.toString(16))
        .filter(Boolean)
        .join("-");
    return `https://twemoji.maxcdn.com/v/latest/svg/${codepoints}.svg`;
};

export const parseYouTubeMessageContent = (
    text: string,
    emojis: any[] | undefined,
    emojiMap: Map<string, string> | null,
    showEmotes: boolean
): ParsedPart[] => {
    if (!showEmotes) return [text];

    let parts: ParsedPart[] = [text];

    const shortcodeMap = new Map<string, string>();
    if (Array.isArray(emojis)) {
        emojis.forEach((emoji: any) => {
            const imageUrl = emoji?.imageUrl || emoji?.url || emoji?.image?.thumbnails?.[0]?.url;
            const shortcuts = [
                emoji?.shortcode,
                ...(Array.isArray(emoji?.shortcuts) ? emoji.shortcuts : []),
                ...(Array.isArray(emoji?.shortcodes) ? emoji.shortcodes : []),
            ].filter(Boolean);
            const emojiId = emoji?.emojiId;

            if (imageUrl) {
                shortcuts.forEach((shortcut: string) => {
                    shortcodeMap.set(shortcut, imageUrl);
                    const trimmed = shortcut.replace(/^:+|:+$/g, "");
                    if (trimmed && trimmed !== shortcut) {
                        shortcodeMap.set(trimmed, imageUrl);
                    }
                    if (trimmed) {
                        shortcodeMap.set(`:${trimmed}:`, imageUrl);
                    }
                });
                if (emojiId && /[^\x00-\x7F]/.test(emojiId)) {
                    shortcodeMap.set(emojiId, imageUrl);
                }
            }
        });
    }

    if (shortcodeMap.size > 0) {
        const escaped = Array.from(shortcodeMap.keys()).map((value) =>
            value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        );
        const regex = new RegExp(`(${escaped.join("|")})`, "g");
        const nextParts: ParsedPart[] = [];
        parts.forEach((part) => {
            if (typeof part !== "string") {
                nextParts.push(part);
                return;
            }
            const split = part.split(regex);
            split.forEach((chunk) => {
                const imageUrl = shortcodeMap.get(chunk);
                if (imageUrl) {
                    nextParts.push({
                        type: "emote",
                        url: imageUrl,
                        name: chunk,
                        provider: "youtube"
                    });
                } else if (chunk) {
                    nextParts.push(chunk);
                }
            });
        });
        parts = nextParts;
    }

    if (emojiMap && emojiMap.size > 0) {
        const nextParts: ParsedPart[] = [];
        const shortcodePattern = /:([a-zA-Z0-9_+-]+):/g;
        parts.forEach((part) => {
            if (typeof part !== "string") {
                nextParts.push(part);
                return;
            }
            let lastIndex = 0;
            for (const match of part.matchAll(shortcodePattern)) {
                const index = match.index ?? 0;
                const shortcode = match[0];
                if (index > lastIndex) {
                    nextParts.push(part.slice(lastIndex, index));
                }
                const url = emojiMap.get(shortcode);
                if (url) {
                    nextParts.push({
                        type: "emote",
                        url,
                        name: shortcode,
                        provider: "youtube"
                    });
                } else {
                    nextParts.push(shortcode);
                }
                lastIndex = index + shortcode.length;
            }
            if (lastIndex < part.length) {
                nextParts.push(part.slice(lastIndex));
            }
        });
        parts = nextParts;
    }

    const emojiRegex = /\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?)*?/gu;
    const withTwemoji: ParsedPart[] = [];
    parts.forEach((part) => {
        if (typeof part !== "string") {
            withTwemoji.push(part);
            return;
        }
        let lastIndex = 0;
        for (const match of part.matchAll(emojiRegex)) {
            const index = match.index ?? 0;
            const emoji = match[0];
            if (index > lastIndex) {
                withTwemoji.push(part.slice(lastIndex, index));
            }
            withTwemoji.push({
                type: "emote",
                url: emojiToTwemojiUrl(emoji),
                name: emoji,
                provider: "twemoji"
            });
            lastIndex = index + emoji.length;
        }
        if (lastIndex < part.length) {
            withTwemoji.push(part.slice(lastIndex));
        }
    });

    return withTwemoji.filter((part) => part !== "");
};

export const extractEmojiMap = (data: any): Map<string, string> => {
    const map = new Map<string, string>();
    const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data?.emojis)
                ? data.emojis
                : Array.isArray(data?.emoji)
                    ? data.emoji
                    : [];
    items.forEach((item: any) => {
        const imageUrl =
            item?.image?.thumbnails?.[0]?.url ||
            item?.image?.url ||
            item?.imageUrl ||
            item?.url ||
            item?.png?.url ||
            item?.svg?.url;
        if (!imageUrl) return;
        const shortcuts = [
            ...(Array.isArray(item?.shortcuts) ? item.shortcuts : []),
            ...(Array.isArray(item?.shortcodes) ? item.shortcodes : []),
            item?.shortcode
        ].filter(Boolean);
        shortcuts.forEach((shortcut: string) => {
            map.set(shortcut, imageUrl);
            const trimmed = shortcut.replace(/^:+|:+$/g, "");
            if (trimmed && trimmed !== shortcut) {
                map.set(trimmed, imageUrl);
            }
            if (trimmed) {
                map.set(`:${trimmed}:`, imageUrl);
            }
        });
    });
    return map;
};

let youtubeEmojiMap: Map<string, string> | null = null;
let youtubeEmojiMapPromise: Promise<Map<string, string>> | null = null;

export const loadYouTubeEmojiMap = async (): Promise<Map<string, string>> => {
    if (youtubeEmojiMap) return youtubeEmojiMap;
    if (youtubeEmojiMapPromise) return youtubeEmojiMapPromise;
    youtubeEmojiMapPromise = (async () => {
        try {
            const res = await fetch("https://www.gstatic.com/youtube/img/emojis/emojis-png-7.json");
            if (!res.ok) return new Map();
            const data = await res.json();
            const map = extractEmojiMap(data);
            youtubeEmojiMap = map;
            return map;
        } catch {
            return new Map();
        }
    })();
    return youtubeEmojiMapPromise;
};

const getKickEmoteUrl = (emote: any): string | undefined => {
    const directUrl = emote?.url || emote?.image_url || emote?.image;
    if (typeof directUrl === "string" && directUrl.length) return directUrl;

    const images = emote?.images || emote?.image;
    if (images) {
        const candidates = [
            images.fullsize,
            images.full,
            images.original,
            images.large,
            images.medium,
            images.small,
            images?.url,
        ];
        for (const candidate of candidates) {
            if (typeof candidate === "string" && candidate.length) return candidate;
        }
    }

    if (emote?.id) {
        return `https://files.kick.com/emotes/${emote.id}/fullsize`;
    }

    return undefined;
};

export const parseKickMessageContent = (
    text: string,
    emotes: any[] | undefined,
    showEmotes: boolean,
    findEmote: EmoteFinder
): ParsedPart[] => {
    if (Array.isArray(emotes) && emotes.length > 0) {
        const positioned = emotes
            .map((emote) => {
                const start = emote?.start ?? emote?.start_index ?? emote?.startIndex ?? emote?.positions?.[0];
                const end = emote?.end ?? emote?.end_index ?? emote?.endIndex ?? emote?.positions?.[1];
                if (typeof start !== "number" || typeof end !== "number") return null;
                const url = getKickEmoteUrl(emote);
                if (!url) return null;
                return {
                    start,
                    end,
                    url,
                    name: String(emote?.name || emote?.code || emote?.id || "emote")
                };
            })
            .filter(Boolean) as Array<{ start: number; end: number; url: string; name: string }>;

        if (positioned.length > 0) {
            positioned.sort((a, b) => a.start - b.start);
            const parts: ParsedPart[] = [];
            let cursor = 0;
            for (const emote of positioned) {
                if (emote.start > cursor) {
                    parts.push(text.slice(cursor, emote.start));
                }
                parts.push({
                    type: "emote",
                    url: emote.url,
                    name: emote.name,
                    provider: "kick"
                });
                cursor = emote.end + 1;
            }
            if (cursor < text.length) {
                parts.push(text.slice(cursor));
            }
            return parts.filter((p) => p !== "");
        }
    }

    const parts: ParsedPart[] = [];
    const emoteRegex = /\[emote:(\d+):([^\]]+)\]/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null = null;

    while ((match = emoteRegex.exec(text)) !== null) {
        const [full, id, name] = match;
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }
        parts.push({
            type: "emote",
            url: `https://files.kick.com/emotes/${id}/fullsize`,
            name,
            provider: "kick"
        });
        lastIndex = match.index + full.length;
    }

    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    const finalParts: ParsedPart[] = [];
    const processTextChunk = (chunk: string) => {
        if (!chunk) return;
        const words = chunk.split(/(\s+)/);
        for (const word of words) {
            const trimmed = word.trim();
            if (!trimmed) {
                finalParts.push(word);
                continue;
            }
            if (showEmotes) {
                const emote = findEmote(trimmed, 'kick');
                if (emote) {
                    const isZeroWidth = ZERO_WIDTH_EMOTES.has(trimmed);
                    finalParts.push({
                        type: "emote",
                        url: emote.url,
                        name: emote.code,
                        provider: emote.provider,
                        isZeroWidth
                    });
                    continue;
                }
            }
            finalParts.push(word);
        }
    };

    for (const part of parts) {
        if (typeof part === 'string') {
            processTextChunk(part);
        } else {
            finalParts.push(part);
        }
    }

    return finalParts.filter((p) => p !== "");
};

const getVeloraEmoteUrl = (emote: any): string | undefined => {
    const directUrl = emote?.url || emote?.imageUrl || emote?.image_url || emote?.image || emote?.src;
    if (typeof directUrl === "string" && directUrl.length) return directUrl;

    const images = emote?.images;
    if (images) {
        const candidates = [
            images.fullsize,
            images.full,
            images.original,
            images.large,
            images.medium,
            images.small,
            images?.url,
        ];
        for (const candidate of candidates) {
            if (typeof candidate === "string" && candidate.length) return candidate;
        }
    }

    return undefined;
};

export const parseVeloraMessageContent = (
    text: string,
    emotes: any[] | undefined,
    showEmotes: boolean,
    veloraEmoteMap: Map<string, string>
): ParsedPart[] => {
    if (Array.isArray(emotes) && emotes.length > 0) {
        const positioned = emotes
            .map((emote) => {
                const start = emote?.start ?? emote?.start_index ?? emote?.startIndex ?? emote?.positions?.[0];
                const end = emote?.end ?? emote?.end_index ?? emote?.endIndex ?? emote?.positions?.[1];
                if (typeof start !== "number" || typeof end !== "number") return null;
                const url = getVeloraEmoteUrl(emote);
                if (!url) return null;
                return {
                    start,
                    end,
                    url,
                    name: String(emote?.code || emote?.name || emote?.id || "emote")
                };
            })
            .filter(Boolean) as Array<{ start: number; end: number; url: string; name: string }>;

        if (positioned.length > 0) {
            positioned.sort((a, b) => a.start - b.start);
            const parts: ParsedPart[] = [];
            let cursor = 0;
            for (const emote of positioned) {
                if (emote.start > cursor) {
                    parts.push(text.slice(cursor, emote.start));
                }
                parts.push({
                    type: "emote",
                    url: emote.url,
                    name: emote.name,
                    provider: "velora"
                });
                cursor = emote.end + 1;
            }
            if (cursor < text.length) {
                parts.push(text.slice(cursor));
            }
            return parts.filter((p) => p !== "");
        }
    }

    const parts: ParsedPart[] = [];
    const words = text.split(/(\s+)/);
    for (const word of words) {
        const trimmed = word.trim();
        if (!trimmed) {
            parts.push(word);
            continue;
        }
        if (showEmotes && veloraEmoteMap.size > 0) {
            const url = veloraEmoteMap.get(trimmed);
            if (url) {
                parts.push({
                    type: "emote",
                    url,
                    name: trimmed,
                    provider: "velora"
                });
                continue;
            }
        }
        parts.push(word);
    }
    return parts.filter((p) => p !== "");
};

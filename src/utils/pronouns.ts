/**
 * Pronouns API Integration
 * Uses the Alejo.io pronouns API (https://pronouns.alejo.io)
 */

export interface PronounInfo {
    display: string;      // e.g., "he/him", "she/her", "they/them"
    singular?: string;    // e.g., "he", "she", "they"
    plural?: string;      // e.g., "him", "her", "them"
    altDisplay?: string;  // Alternative display format
    color: string;        // Badge background color
    isGradient?: boolean; // Whether the color is a gradient
}

// Pronoun display mappings with unique colors
const PRONOUN_DISPLAY: { [key: string]: PronounInfo } = {
    // Binary pronouns
    'hehim': { display: 'he/him', singular: 'he', plural: 'him', color: '#3B82F6' }, // Blue
    'sheher': { display: 'she/her', singular: 'she', plural: 'her', color: '#EC4899' }, // Pink

    // Non-binary / Neutral
    'theythem': { display: 'they/them', singular: 'they', plural: 'them', color: '#A855F7' }, // Purple
    'itits': { display: 'it/its', singular: 'it', plural: 'its', color: '#14B8A6' }, // Teal

    // Combination pronouns (gradients)
    'hethey': { display: 'he/they', singular: 'he', plural: 'they', color: 'linear-gradient(135deg, #3B82F6, #A855F7)', isGradient: true }, // Blue → Purple
    'shethey': { display: 'she/they', singular: 'she', plural: 'they', color: 'linear-gradient(135deg, #EC4899, #A855F7)', isGradient: true }, // Pink → Purple

    // Neopronouns (fresh/unique colors)
    'aeaer': { display: 'ae/aer', singular: 'ae', plural: 'aer', color: '#06B6D4' }, // Cyan
    'eem': { display: 'e/em', singular: 'e', plural: 'em', color: '#8B5CF6' }, // Violet
    'faefaer': { display: 'fae/faer', singular: 'fae', plural: 'faer', color: '#D946EF' }, // Fuchsia
    'perper': { display: 'per/per', singular: 'per', plural: 'per', color: '#F59E0B' }, // Amber
    'vever': { display: 've/ver', singular: 've', plural: 'ver', color: '#10B981' }, // Emerald
    'xexem': { display: 'xe/xem', singular: 'xe', plural: 'xem', color: '#6366F1' }, // Indigo
    'ziehir': { display: 'zie/hir', singular: 'zie', plural: 'hir', color: '#F472B6' }, // Light Pink

    // Open/Flexible (special styles)
    'any': { display: 'any', altDisplay: 'any pronouns', color: 'linear-gradient(135deg, #E40303, #FF8C00, #FFED00, #008026, #24408E, #732982)', isGradient: true }, // Rainbow
    'other': { display: 'other', altDisplay: 'ask me', color: '#6B7280' }, // Gray
    'ask': { display: 'ask', altDisplay: 'ask me', color: '#6B7280' }, // Gray
};

const PRONOUNS_API_BASE = "https://pronouns.alejo.io/api";

const pendingRequests = new Map<string, Promise<PronounInfo | null>>();

/**
 * Get pronouns for a single user
 */
export async function getUserPronouns(username: string): Promise<string | null> {
    const pronounInfo = await getUserPronounInfo(username);
    return pronounInfo?.display || null;
}

/**
 * Get detailed pronoun info for a user
 */
export async function getUserPronounInfo(username: string): Promise<PronounInfo | null> {
    const lowerUser = username.toLowerCase();

    // Check if there's already a pending request
    if (pendingRequests.has(lowerUser)) {
        return pendingRequests.get(lowerUser)!;
    }

    const promise = (async () => {
        try {
            const response = await fetch(`${PRONOUNS_API_BASE}/users/${lowerUser}?_=${Date.now()}`, {
                cache: "no-store"
            });

            if (!response.ok) {
                return null;
            }

            const data = await response.json();

            // API returns an array
            if (Array.isArray(data) && data.length > 0) {
                const pronoun = data[0];

                // Try to match to known pronouns
                const pronounId = pronoun.pronoun_id || pronoun.id;
                if (pronounId && PRONOUN_DISPLAY[pronounId]) {
                    const info = PRONOUN_DISPLAY[pronounId];
                    return info;
                }

                // Fallback: construct from API response
                if (pronoun.subject && pronoun.object) {
                    const info: PronounInfo = {
                        display: `${pronoun.subject}/${pronoun.object}`,
                        singular: pronoun.subject,
                        plural: pronoun.object,
                        color: '#A855F7' // Default purple for unknown pronouns
                    };
                    return info;
                }

                // Last resort: use slug if available
                if (pronoun.slug || pronoun.pronoun_id) {
                    const slug = pronoun.slug || pronoun.pronoun_id;
                    const info: PronounInfo = { display: slug, color: '#A855F7' }; // Default purple
                    return info;
                }
            }

            return null;
        } catch (e) {
            console.error("Failed to fetch pronouns for", username, e);
            return null;
        } finally {
            pendingRequests.delete(lowerUser);
        }
    })();

    pendingRequests.set(lowerUser, promise);
    return promise;
}

/**
 * Batch fetch pronouns for multiple users (more efficient)
 */
export async function batchGetPronouns(usernames: string[]): Promise<Map<string, PronounInfo>> {
    const results = new Map<string, PronounInfo>();
    const uncached: string[] = [];

    // Check cache first
    for (const username of usernames) {
        const lower = username.toLowerCase();
        if (pronounCache.has(lower)) {
            const entry = pronounCache.get(lower)!;
            if (Date.now() - entry.timestamp < CACHE_TTL && entry.data) {
                results.set(lower, entry.data);
                continue;
            }
        }
        uncached.push(lower);
    }

    // Fetch uncached users in parallel (with concurrency limit)
    const BATCH_SIZE = 10;
    for (let i = 0; i < uncached.length; i += BATCH_SIZE) {
        const batch = uncached.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
            batch.map(username => getUserPronounInfo(username))
        );

        batch.forEach((username, index) => {
            if (batchResults[index]) {
                results.set(username, batchResults[index]!);
            }
        });
    }

    return results;
}

/**
 * Clear the pronoun cache
 */
export function clearPronounCache(): void {
    // No-op: caching disabled
}

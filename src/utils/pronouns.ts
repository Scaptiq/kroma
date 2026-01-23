/**
 * Pronouns API Integration
 * Uses the Alejo.io pronouns API (https://pronouns.alejo.io)
 */

export interface PronounInfo {
    display: string;      // e.g., "he/him", "she/her", "they/them"
    singular?: string;    // e.g., "he", "she", "they"
    plural?: string;      // e.g., "him", "her", "them"
    altDisplay?: string;  // Alternative display format
}

// Pronoun display mappings
const PRONOUN_DISPLAY: { [key: string]: PronounInfo } = {
    'hehim': { display: 'he/him', singular: 'he', plural: 'him' },
    'sheher': { display: 'she/her', singular: 'she', plural: 'her' },
    'theythem': { display: 'they/them', singular: 'they', plural: 'them' },
    'aeaer': { display: 'ae/aer', singular: 'ae', plural: 'aer' },
    'eem': { display: 'e/em', singular: 'e', plural: 'em' },
    'faefaer': { display: 'fae/faer', singular: 'fae', plural: 'faer' },
    'hethey': { display: 'he/they', singular: 'he', plural: 'they' },
    'itits': { display: 'it/its', singular: 'it', plural: 'its' },
    'perper': { display: 'per/per', singular: 'per', plural: 'per' },
    'shethey': { display: 'she/they', singular: 'she', plural: 'they' },
    'vever': { display: 've/ver', singular: 've', plural: 'ver' },
    'xexem': { display: 'xe/xem', singular: 'xe', plural: 'xem' },
    'ziehir': { display: 'zie/hir', singular: 'zie', plural: 'hir' },
    'any': { display: 'any', altDisplay: 'any pronouns' },
    'other': { display: 'other', altDisplay: 'ask me' },
    'ask': { display: 'ask', altDisplay: 'ask me' },
};

const PRONOUNS_API_BASE = "https://pronouns.alejo.io/api";

// Cache with TTL
interface CacheEntry {
    data: PronounInfo | null;
    timestamp: number;
}

const pronounCache = new Map<string, CacheEntry>();
const pendingRequests = new Map<string, Promise<PronounInfo | null>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

    // Check cache with TTL
    if (pronounCache.has(lowerUser)) {
        const entry = pronounCache.get(lowerUser)!;
        if (Date.now() - entry.timestamp < CACHE_TTL) {
            return entry.data;
        }
        // Cache expired, remove it
        pronounCache.delete(lowerUser);
    }

    // Check if there's already a pending request
    if (pendingRequests.has(lowerUser)) {
        return pendingRequests.get(lowerUser)!;
    }

    const promise = (async () => {
        try {
            const response = await fetch(`${PRONOUNS_API_BASE}/users/${lowerUser}`);

            if (!response.ok) {
                pronounCache.set(lowerUser, { data: null, timestamp: Date.now() });
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
                    pronounCache.set(lowerUser, { data: info, timestamp: Date.now() });
                    return info;
                }

                // Fallback: construct from API response
                if (pronoun.subject && pronoun.object) {
                    const info: PronounInfo = {
                        display: `${pronoun.subject}/${pronoun.object}`,
                        singular: pronoun.subject,
                        plural: pronoun.object
                    };
                    pronounCache.set(lowerUser, { data: info, timestamp: Date.now() });
                    return info;
                }

                // Last resort: use slug if available
                if (pronoun.slug || pronoun.pronoun_id) {
                    const slug = pronoun.slug || pronoun.pronoun_id;
                    const info: PronounInfo = { display: slug };
                    pronounCache.set(lowerUser, { data: info, timestamp: Date.now() });
                    return info;
                }
            }

            pronounCache.set(lowerUser, { data: null, timestamp: Date.now() });
            return null;
        } catch (e) {
            console.error("Failed to fetch pronouns for", username, e);
            pronounCache.set(lowerUser, { data: null, timestamp: Date.now() });
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
    pronounCache.clear();
}

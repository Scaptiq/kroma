export type CacheEntry<V> = {
    value: V | null;
    timestamp: number;
};

export type AsyncCache<K, V> = {
    getCached: (key: K) => V | null | undefined;
    setCached: (key: K, value: V | null) => void;
    fetch: (key: K, fetcher: () => Promise<V | null>) => Promise<V | null>;
    clear: () => void;
};

export function createAsyncCache<K, V>(options: { ttlMs: number; keyToString?: (key: K) => string }): AsyncCache<K, V> {
    const cache = new Map<string, CacheEntry<V>>();
    const inflight = new Map<string, Promise<V | null>>();
    const keyToString = options.keyToString ?? ((key: K) => String(key));

    const isFresh = (entry: CacheEntry<V>) => Date.now() - entry.timestamp < options.ttlMs;

    const getCached = (key: K) => {
        const cacheKey = keyToString(key);
        const entry = cache.get(cacheKey);
        if (!entry) return undefined;
        if (!isFresh(entry)) {
            cache.delete(cacheKey);
            return undefined;
        }
        return entry.value;
    };

    const setCached = (key: K, value: V | null) => {
        cache.set(keyToString(key), { value, timestamp: Date.now() });
    };

    const fetch = async (key: K, fetcher: () => Promise<V | null>) => {
        const cached = getCached(key);
        if (cached !== undefined) return cached;

        const cacheKey = keyToString(key);
        if (inflight.has(cacheKey)) {
            return inflight.get(cacheKey)!;
        }

        const promise = (async () => {
            try {
                const value = await fetcher();
                setCached(key, value ?? null);
                return value ?? null;
            } finally {
                inflight.delete(cacheKey);
            }
        })();

        inflight.set(cacheKey, promise);
        return promise;
    };

    const clear = () => {
        cache.clear();
        inflight.clear();
    };

    return { getCached, setCached, fetch, clear };
}

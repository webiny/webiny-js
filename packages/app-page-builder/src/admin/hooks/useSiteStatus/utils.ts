const MINUTE = 60 * 1000;
interface CacheValue {
    active?: boolean;
    cacheTimer?: number;
    [key: string]: any;
}
// Plain in-memory store for fetch response
const CACHE: Record<string, CacheValue> = {};

function getCacheTimer(time: number): number {
    let cacheTimer = 0;
    const now = new Date().getTime();
    if (cacheTimer < now + time) {
        cacheTimer = now + time;
    }
    return cacheTimer;
}
interface FetchWithCacheParams {
    url: string;
    time?: number;
    ignoreCache: boolean;
}
export async function fetchWithCache(params: FetchWithCacheParams): Promise<CacheValue> {
    const { url, time = 5 * MINUTE, ignoreCache } = params;

    const now = new Date().getTime();

    const cacheItem = CACHE[url];

    if (!cacheItem || (cacheItem.cacheTimer || 0) < now || ignoreCache) {
        try {
            const response = await fetch(url, {
                method: "GET",
                mode: "no-cors"
            });
            // Update cache with response
            if (response) {
                CACHE[url] = {
                    ...response,
                    active: true,
                    cacheTimer: getCacheTimer(time)
                };
            }
        } catch {
            CACHE[url] = {
                active: false
            };
        }
    }

    return CACHE[url];
}

interface PingSiteParams {
    url: string;
    cb: (value: boolean) => void;
    ignoreCache: boolean;
}
export const pingSite = async (params: PingSiteParams): Promise<void> => {
    const { url, cb, ignoreCache } = params;
    try {
        const response = await fetchWithCache({ url, ignoreCache });

        cb(response ? response.active || false : false);
    } catch (e) {
        console.error(e);
        cb(false);
    }
};

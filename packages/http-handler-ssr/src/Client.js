import got from "got";

const API_ACTION = {
    INVALIDATE_SSR_CACHE_BY_PATH: "invalidateSsrCacheByPath",
    INVALIDATE_SSR_CACHE_BY_TAGS: "invalidateSsrCacheByTags"
};

const ssrApiCall = async ({ url, action, actionPayload, async }) => {
    const args = {
        method: "POST",
        body: JSON.stringify({ ssr: [action, actionPayload] })
    };

    if (async === false) {
        return await got(url, args);
    }

    try {
        await got(url, {
            ...args,
            timeout: 200,
            retry: 0
        });
    } catch {
        // Do nothing.
    }
};

export default class Client {
    constructor(url) {
        this.url = url;
    }

    async invalidateSsrCacheByPath({ path = null, refresh, expired, async } = {}) {
        await ssrApiCall({
            url: this.url,
            action: API_ACTION.INVALIDATE_SSR_CACHE_BY_PATH,
            actionPayload: { path, refresh, expired },
            async
        });
    }

    async invalidateSsrCacheByTags({ tags = null, async } = {}) {
        await ssrApiCall({
            url: this.url,
            action: API_ACTION.INVALIDATE_SSR_CACHE_BY_TAGS,
            actionPayload: { tags },
            async
        });
    }
}

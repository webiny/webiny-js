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

interface InvalidateSsrCacheByPathParams {
    path: string;
    refresh?: boolean;
    expired?: boolean;
    async?: boolean;
}

type Tag = {
    id?: string;
    class?: string;
};

interface InvalidateSsrCacheByTagsParams {
    tags: Tag[];
    async?: boolean;
}

export default class Client {
    url: string;

    constructor(url) {
        this.url = url;
    }

    async invalidateSsrCacheByPath({
        path = null,
        refresh = false,
        expired = false,
        async = true
    }: InvalidateSsrCacheByPathParams) {
        await ssrApiCall({
            url: this.url,
            action: API_ACTION.INVALIDATE_SSR_CACHE_BY_PATH,
            actionPayload: { path, refresh, expired },
            async
        });
    }

    async invalidateSsrCacheByTags({ tags = null, async = true }: InvalidateSsrCacheByTagsParams) {
        await ssrApiCall({
            url: this.url,
            action: API_ACTION.INVALIDATE_SSR_CACHE_BY_TAGS,
            actionPayload: { tags },
            async
        });
    }
}

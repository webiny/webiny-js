import { PublicUrls } from "@webiny/api-core/features/publicUrls/index.js";
import { DefaultSrcPrefix } from "./abstractions.js";

class PublicUrlsDefaultSrcPrefixImpl implements DefaultSrcPrefix.Interface {
    constructor(private publicUrls: PublicUrls.Interface) {}

    async get(): Promise<string> {
        const apiUrl = await this.publicUrls.getApiUrl();
        return apiUrl.join("/files/");
    }
}

export const PublicUrlsDefaultSrcPrefix = DefaultSrcPrefix.createImplementation({
    implementation: PublicUrlsDefaultSrcPrefixImpl,
    dependencies: [PublicUrls]
});

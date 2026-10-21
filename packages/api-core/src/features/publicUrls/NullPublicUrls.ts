import { PublicUrls } from "./abstractions.js";

/** Default for hosting types (and tests) that don't supply public URLs. */
class NullPublicUrlsImpl implements PublicUrls.Interface {
    async getApiUrl() {
        return null;
    }

    async getAdminUrl() {
        return null;
    }
}

export const NullPublicUrls = PublicUrls.createImplementation({
    implementation: NullPublicUrlsImpl,
    dependencies: []
});

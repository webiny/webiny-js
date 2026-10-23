import { PublicUrls } from "./abstractions.js";
import { PublicUrl } from "./PublicUrl.js";

/** Default for hosting types (and tests) that don't supply public URLs. */
class NullPublicUrlsImpl implements PublicUrls.Interface {
    async getApiUrl() {
        return PublicUrl.unknown();
    }

    async getAdminUrl() {
        return PublicUrl.unknown();
    }
}

export const NullPublicUrls = PublicUrls.createImplementation({
    implementation: NullPublicUrlsImpl,
    dependencies: []
});

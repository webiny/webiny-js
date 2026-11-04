import { PublicUrls } from "@webiny/api-core/features/publicUrls/index.js";
import { StandaloneConfig } from "~/config/abstractions.js";

/** Standalone: the URLs come from `WEBINY_API_URL` / `WEBINY_ADMIN_URL`, read at startup. */
class ConfigPublicUrlsImpl implements PublicUrls.Interface {
    constructor(private config: StandaloneConfig.Interface) {}

    async getApiUrl() {
        return this.config.apiUrl;
    }

    async getAdminUrl() {
        return this.config.adminUrl;
    }
}

export const ConfigPublicUrls = PublicUrls.createImplementation({
    implementation: ConfigPublicUrlsImpl,
    dependencies: [StandaloneConfig]
});

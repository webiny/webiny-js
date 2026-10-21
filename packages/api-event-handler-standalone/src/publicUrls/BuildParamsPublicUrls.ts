import { PublicUrl } from "@webiny/api-core/features/publicUrls/index.js";
import { PublicUrls } from "@webiny/api-core/features/publicUrls/index.js";
import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";

export const API_URL_BUILD_PARAM = "WEBINY_API_URL";
export const ADMIN_URL_BUILD_PARAM = "WEBINY_ADMIN_URL";

/**
 * Standalone: there is no deploy step to discover URLs from, so they come from the
 * `WEBINY_API_URL` / `WEBINY_ADMIN_URL` build params. `<Infra.ApiUrl>` and `<Infra.AdminUrl>` bake
 * defaults in at build time, and `RuntimeEnvBuildParamsDecorator` lets the same env vars override them
 * when the server starts, so one build can run on any domain.
 */
class BuildParamsPublicUrlsImpl implements PublicUrls.Interface {
    constructor(private buildParams: BuildParams.Interface) {}

    async getApiUrl() {
        const value = this.buildParams.get(API_URL_BUILD_PARAM);
        return PublicUrl.from(value);
    }

    async getAdminUrl() {
        const value = this.buildParams.get(ADMIN_URL_BUILD_PARAM);
        return PublicUrl.from(value);
    }
}

export const BuildParamsPublicUrls = PublicUrls.createImplementation({
    implementation: BuildParamsPublicUrlsImpl,
    dependencies: [BuildParams]
});

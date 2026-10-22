import { PublicUrl } from "@webiny/api-core/features/publicUrls/index.js";
import { PublicUrls } from "@webiny/api-core/features/publicUrls/index.js";
import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";

export const API_URL_BUILD_PARAM = "WEBINY_API_URL";
export const ADMIN_URL_BUILD_PARAM = "WEBINY_ADMIN_URL";

/**
 * Standalone: there is no deploy step to discover URLs from, so the project configures them with
 * `<Infra.ApiUrl>` and `<Infra.AdminUrl>`, which bake them in as build params.
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

import { PublicUrls } from "./abstractions.js";
import { BuildParams } from "~/features/buildParams/index.js";
import { normalizeUrl } from "./normalizeUrl.js";

export const API_URL_BUILD_PARAM = "WEBINY_API_URL";
export const ADMIN_URL_BUILD_PARAM = "WEBINY_ADMIN_URL";

/**
 * Standalone: there is no deploy step to discover URLs from, so the project configures them with
 * `<Infra.ApiUrl>` and `<Infra.AdminUrl>`, which bake them in as build params.
 */
class BuildParamsPublicUrlsImpl implements PublicUrls.Interface {
    constructor(private buildParams: BuildParams.Interface) {}

    async getApiUrl() {
        return normalizeUrl(this.buildParams.get(API_URL_BUILD_PARAM));
    }

    async getAdminUrl() {
        return normalizeUrl(this.buildParams.get(ADMIN_URL_BUILD_PARAM));
    }
}

export const BuildParamsPublicUrls = PublicUrls.createImplementation({
    implementation: BuildParamsPublicUrlsImpl,
    dependencies: [BuildParams]
});

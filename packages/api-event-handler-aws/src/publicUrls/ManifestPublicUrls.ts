import { PublicUrl, PublicUrls } from "@webiny/api-core/features/publicUrls/index.js";
import { ServiceDiscovery } from "@webiny/api-core/features/serviceDiscovery/index.js";

/**
 * AWS: the `api` and `admin` Pulumi apps write their public URL (custom domain if set, CloudFront
 * otherwise) into the service manifest at deploy time. The API is deployed before the Admin app, so
 * the Admin URL is unknown until the Admin app has been deployed.
 */
class ManifestPublicUrlsImpl implements PublicUrls.Interface {
    async getApiUrl() {
        const manifest = await ServiceDiscovery.load();
        return PublicUrl.from(manifest?.api?.url);
    }

    async getAdminUrl() {
        const manifest = await ServiceDiscovery.load();
        return PublicUrl.from(manifest?.admin?.url);
    }
}

export const ManifestPublicUrls = PublicUrls.createImplementation({
    implementation: ManifestPublicUrlsImpl,
    dependencies: []
});

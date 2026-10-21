import { PublicUrls } from "./abstractions.js";
import { ServiceDiscovery } from "~/features/serviceDiscovery/index.js";
import { normalizeUrl } from "./normalizeUrl.js";

/**
 * AWS: the `api` and `admin` Pulumi apps write their public URL (custom domain if set, CloudFront
 * otherwise) into the service manifest at deploy time. The API is deployed before the Admin app, so
 * the Admin URL is `null` until the Admin app has been deployed.
 */
class ManifestPublicUrlsImpl implements PublicUrls.Interface {
    async getApiUrl() {
        const manifest = await ServiceDiscovery.load();
        return normalizeUrl(manifest?.api?.url);
    }

    async getAdminUrl() {
        const manifest = await ServiceDiscovery.load();
        return normalizeUrl(manifest?.admin?.url);
    }
}

export const ManifestPublicUrls = PublicUrls.createImplementation({
    implementation: ManifestPublicUrlsImpl,
    dependencies: []
});

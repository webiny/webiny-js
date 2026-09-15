import { getWcpProjectLicense, NullLicense, License } from "@webiny/wcp";
import type { DecryptedWcpProjectLicense, ILicense } from "@webiny/wcp/types.js";
import type { CachedWcpProjectLicense } from "~/features/wcp/WcpContext/types.js";
import { getWcpProjectLicenseCacheKey } from "~/features/wcp/WcpContext/utils.js";
import { resolveWcpProjectEnvironment } from "~/features/wcp/resolveWcpProjectEnvironment.js";

/**
 * Loads and process-caches the WCP project license. Static because the cache is process-global (one
 * license per deployment): the pre-register refresh in `registerApiRequestStack` calls `load()` to
 * populate it, and `WcpLicenseProvider` / register-time feature-flag gates read it synchronously via
 * `getCached()`. Not DI — it must be usable before any container exists (before register).
 */
export class WcpLicenseLoader {
    private static readonly wcpProjectEnvironment = resolveWcpProjectEnvironment();

    private static cached: CachedWcpProjectLicense = {
        cacheKey: null,
        project: null,
        license: new NullLicense()
    };

    // In-flight fetch, memoized so concurrent cache-miss callers coalesce onto a single WCP request
    // (self-hosted runs many requests in one process; we never want two license fetches at once).
    private static inflight: Promise<ILicense> | null = null;

    /**
     * Synchronously read the currently cached license. `load()` must have been awaited at least once
     * this request (the pre-register refresh does this), so this reflects the live license — letting
     * register()-time feature-flag checks read it synchronously.
     */
    static getCached(): ILicense {
        return WcpLicenseLoader.cached.license;
    }

    /**
     * Seed the cache with an already-resolved license (tests pass a pre-built one). Marks it fresh so
     * a subsequent `load()` returns it without a fetch. This is how `WcpLicenseProviderImpl` installs
     * an initial license.
     */
    static seed(license: ILicense): void {
        WcpLicenseLoader.cached.license = license;
        WcpLicenseLoader.cached.cacheKey = getWcpProjectLicenseCacheKey();
    }

    static async load(testProjectLicense?: DecryptedWcpProjectLicense): Promise<ILicense> {
        const cached = WcpLicenseLoader.cached;

        if (testProjectLicense) {
            cached.license = License.fromLicenseDto(testProjectLicense);
            return cached.license;
        }

        const env = WcpLicenseLoader.wcpProjectEnvironment;
        if (!env) {
            return cached.license;
        }

        const currentCacheKey = getWcpProjectLicenseCacheKey();
        if (cached.cacheKey === currentCacheKey) {
            return cached.license;
        }

        // Cache miss (first load or the ~5-min key rotated). Coalesce concurrent callers onto one fetch.
        if (WcpLicenseLoader.inflight) {
            return WcpLicenseLoader.inflight;
        }

        WcpLicenseLoader.inflight = (async () => {
            // Pull the project license from the WCP API.
            const decryptedLicenseDto = await getWcpProjectLicense({
                orgId: env.org.id,
                projectId: env.project.id,
                projectEnvironmentApiKey: env.apiKey
            });

            if (decryptedLicenseDto) {
                cached.project = {
                    orgId: decryptedLicenseDto.orgId,
                    projectId: decryptedLicenseDto.projectId,
                    package: decryptedLicenseDto.package
                };
            }

            cached.license = License.fromLicenseDto(decryptedLicenseDto);
            // Mark fresh only after a successful fetch — a throw leaves the key unset so the next call retries.
            cached.cacheKey = currentCacheKey;
            return cached.license;
        })().finally(() => {
            WcpLicenseLoader.inflight = null;
        });

        return WcpLicenseLoader.inflight;
    }
}

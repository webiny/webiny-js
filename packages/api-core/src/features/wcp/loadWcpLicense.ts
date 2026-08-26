import { getWcpProjectLicense, NullLicense } from "@webiny/wcp";
import type { DecryptedWcpProjectLicense, ILicense } from "@webiny/wcp/types.js";
import { License } from "@webiny/wcp";
import type { CachedWcpProjectLicense } from "~/features/wcp/WcpContext/types.js";
import { getWcpProjectLicenseCacheKey } from "~/features/wcp/WcpContext/utils.js";
import { resolveWcpProjectEnvironment } from "~/features/wcp/resolveWcpProjectEnvironment.js";

const wcpProjectEnvironment = resolveWcpProjectEnvironment();

const cachedLicense: CachedWcpProjectLicense = {
    cacheKey: null,
    project: null,
    license: new NullLicense()
};

// In-flight fetch, memoized so concurrent cache-miss callers coalesce onto a single WCP request
// (self-hosted runs many requests in one process; we never want two license fetches at once).
let inflight: Promise<ILicense> | null = null;

/**
 * Synchronously read the currently cached WCP license. `loadWcpLicense()` must have been awaited at
 * least once this request (the pre-register refresh in `registerApiRequestStack` does this), so this
 * reflects the live license — letting register()-time feature-flag checks read it synchronously.
 */
export function getCachedWcpLicense(): ILicense {
    return cachedLicense.license;
}

/**
 * Seed the cache with an already-resolved license (tests pass a pre-built one). Marks it fresh so a
 * subsequent `loadWcpLicense()` returns it without a fetch. This is how `WcpLicenseProviderImpl`
 * installs an initial license.
 */
export function seedWcpLicenseCache(license: ILicense): void {
    cachedLicense.license = license;
    cachedLicense.cacheKey = getWcpProjectLicenseCacheKey();
}

export async function loadWcpLicense(
    testProjectLicense?: DecryptedWcpProjectLicense
): Promise<ILicense> {
    if (testProjectLicense) {
        cachedLicense.license = License.fromLicenseDto(testProjectLicense);
        return cachedLicense.license;
    }

    if (!wcpProjectEnvironment) {
        return cachedLicense.license;
    }

    const currentCacheKey = getWcpProjectLicenseCacheKey();
    if (cachedLicense.cacheKey === currentCacheKey) {
        return cachedLicense.license;
    }

    // Cache miss (first load or the ~5-min key rotated). Coalesce concurrent callers onto one fetch.
    if (inflight) {
        return inflight;
    }

    inflight = (async () => {
        // Pull the project license from the WCP API.
        const decryptedLicenseDto = await getWcpProjectLicense({
            orgId: wcpProjectEnvironment.org.id,
            projectId: wcpProjectEnvironment.project.id,
            projectEnvironmentApiKey: wcpProjectEnvironment.apiKey
        });

        if (decryptedLicenseDto) {
            cachedLicense.project = {
                orgId: decryptedLicenseDto.orgId,
                projectId: decryptedLicenseDto.projectId,
                package: decryptedLicenseDto.package
            };
        }

        cachedLicense.license = License.fromLicenseDto(decryptedLicenseDto);
        // Mark fresh only after a successful fetch — a throw leaves the key unset so the next call retries.
        cachedLicense.cacheKey = currentCacheKey;
        return cachedLicense.license;
    })().finally(() => {
        inflight = null;
    });

    return inflight;
}

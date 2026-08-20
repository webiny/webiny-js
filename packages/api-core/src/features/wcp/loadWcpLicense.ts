import { getWcpProjectLicense, getWcpProjectEnvironment, NullLicense } from "@webiny/wcp";
import type {
    DecryptedWcpProjectLicense,
    ILicense,
    WcpProjectEnvironment
} from "@webiny/wcp/types.js";
import { License } from "@webiny/wcp";
import type { CachedWcpProjectLicense } from "~/features/wcp/WcpContext/types.js";
import { getWcpProjectLicenseCacheKey } from "~/features/wcp/WcpContext/utils.js";

/**
 * Resolve the WCP project environment used to fetch the license. Prefer the CLI-computed
 * WCP_PROJECT_ENVIRONMENT blob (set by `applyWcpEnvVars` during `webiny serve` and the AWS deploy).
 * When it's absent — a CLI-less self-hosted deploy that boots the built handler directly (e.g.
 * `node start.mjs`) — derive the same org, project and api key straight from the runtime env, so a
 * fresh license can still be fetched.
 */
function resolveWcpProjectEnvironment(): WcpProjectEnvironment | null {
    const fromBlob = getWcpProjectEnvironment();
    if (fromBlob) {
        return fromBlob;
    }

    const projectId = process.env.WEBINY_PROJECT_ID || process.env.WCP_PROJECT_ID;
    const apiKey =
        process.env.WEBINY_PROJECT_API_KEY || process.env.WCP_PROJECT_ENVIRONMENT_API_KEY;
    if (!projectId || !apiKey) {
        return null;
    }

    // WEBINY_PROJECT_ID has an "orgId/projectId" shape.
    const [orgId, project] = projectId.split("/");
    if (!orgId || !project) {
        return null;
    }

    // `id` is intentionally empty. The WCP backend identifies the specific project environment
    // from the api key (sent as the request's authorization header); the license fetch only uses
    // org/project (URL path) + apiKey (auth), never the environment id. So there's nothing to fill.
    return { id: "", apiKey, org: { id: orgId }, project: { id: project } };
}

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

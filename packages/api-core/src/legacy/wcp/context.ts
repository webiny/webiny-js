import { getWcpProjectLicense, getWcpProjectEnvironment, NullLicense } from "@webiny/wcp";
import type { DecryptedWcpProjectLicense, ILicense } from "@webiny/wcp/types.js";
import { License } from "@webiny/wcp";
import type { CachedWcpProjectLicense } from "~/features/wcp/WcpContext/types.js";
import { getWcpProjectLicenseCacheKey } from "~/features/wcp/WcpContext/utils.js";

const wcpProjectEnvironment = getWcpProjectEnvironment();

const cachedLicense: CachedWcpProjectLicense = {
    cacheKey: null,
    project: null,
    license: new NullLicense()
};

export async function loadWcpLicense(
    testProjectLicense?: DecryptedWcpProjectLicense
): Promise<ILicense> {
    if (testProjectLicense) {
        cachedLicense.license = License.fromLicenseDto(testProjectLicense);
    } else if (wcpProjectEnvironment) {
        const currentCacheKey = getWcpProjectLicenseCacheKey();
        if (cachedLicense.cacheKey !== currentCacheKey) {
            cachedLicense.cacheKey = currentCacheKey;
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
        }
    }

    return cachedLicense.license;
}

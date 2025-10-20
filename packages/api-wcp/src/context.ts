import { ContextPlugin } from "@webiny/api";
import { getWcpProjectLicense, getWcpProjectEnvironment, NullLicense } from "@webiny/wcp";
import type { CachedWcpProjectLicense, WcpContext } from "~/types.js";
import type { DecryptedWcpProjectLicense, ILicense } from "@webiny/wcp/types.js";
import { LegacyWcpContext } from "~/legacy/LegacyWcpContext.js";
import { License } from "@webiny/wcp";
import { getWcpProjectLicenseCacheKey } from "./utils";
import { WcpFeatures } from "~/features/index.js";

const wcpProjectEnvironment = getWcpProjectEnvironment();

const cachedLicense: CachedWcpProjectLicense = {
    cacheKey: null,
    project: null,
    license: new NullLicense()
};

async function loadLicense(testProjectLicense?: DecryptedWcpProjectLicense): Promise<ILicense> {
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

export interface CreateWcpContextParams {
    testProjectLicense?: DecryptedWcpProjectLicense;
}

export const createWcpContext = (params: CreateWcpContextParams = {}) => {
    const plugin = new ContextPlugin<WcpContext>(async context => {
        const license = await loadLicense(params.testProjectLicense);

        WcpFeatures.register(context.container, license);

        // Legacy context
        context.wcp = new LegacyWcpContext(context.container);
    });

    plugin.name = "wcp.context.create";

    return plugin;
};

import { getWcpProjectLicense, getWcpProjectEnvironment, NullLicense } from "@webiny/wcp";
import type { DecryptedWcpProjectLicense, ILicense } from "@webiny/wcp/types.js";
import { License } from "@webiny/wcp";
import { createRegisterExtensionPlugin } from "@webiny/handler/plugins/RegisterExtensionPlugin.js";
import type { CachedWcpProjectLicense } from "~/features/wcp/WcpContext/types.js";
import { getWcpProjectLicenseCacheKey } from "~/features/wcp/WcpContext/utils.js";
import { WcpFeature } from "~/features/wcp/WcpFeature.js";
import { LegacyWcpContext } from "./LegacyWcpContext.js";
import { createWcpGraphQL } from "~/graphql/wcp/graphql.js";

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
    const plugin = createRegisterExtensionPlugin(async context => {
        const license = await loadLicense(params.testProjectLicense);

        WcpFeature.register(context.container, license);

        // @ts-expect-error This is a legacy property
        context.wcp = new LegacyWcpContext(context.container);

        context.plugins.register(createWcpGraphQL());
    });

    plugin.name = "wcp.context.create";

    return plugin;
};

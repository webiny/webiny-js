import { Container } from "@webiny/di";
import { getWcpProjectLicense, getWcpProjectEnvironment, NullLicense } from "@webiny/wcp";
import { License } from "@webiny/wcp";
import { GraphQLContextEnhancer } from "@webiny/handler-graphql";
import { RequestContainer } from "@webiny/event-handler-core";
import { LegacyContext as SecurityLegacyContext } from "~/legacy/security/LegacyContext.js";
import { LegacyContext as TenancyLegacyContext } from "~/legacy/tenancy/LegacyContext.js";
import { LegacyWcpContext } from "~/legacy/wcp/LegacyWcpContext.js";
import { WcpFeature } from "~/features/wcp/WcpFeature.js";
import { getWcpProjectLicenseCacheKey } from "~/features/wcp/WcpContext/utils.js";
import type { CachedWcpProjectLicense } from "~/features/wcp/WcpContext/types.js";
import type { IGraphQLContextEnhancer } from "@webiny/handler-graphql";

const wcpProjectEnvironment = getWcpProjectEnvironment();

// Module-level cache: survives Lambda warm starts, refreshed every 5 minutes.
const cachedLicense: CachedWcpProjectLicense = {
    cacheKey: null,
    project: null,
    license: new NullLicense()
};

async function loadWcpLicense() {
    if (!wcpProjectEnvironment) {
        return cachedLicense.license;
    }

    const currentCacheKey = getWcpProjectLicenseCacheKey();
    if (cachedLicense.cacheKey === currentCacheKey) {
        return cachedLicense.license;
    }

    cachedLicense.cacheKey = currentCacheKey;

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
    return cachedLicense.license;
}

class ApiCoreContextEnhancerImpl implements IGraphQLContextEnhancer {
    constructor(private container: Container) {}

    async enhance(ctx: Record<string, any>): Promise<void> {
        // Load (or refresh from cache) the WCP license and re-register WcpFeature in the
        // child (request) container so the real license is available to all other enhancers.
        const license = await loadWcpLicense();
        WcpFeature.register(this.container, license);

        ctx.security = new SecurityLegacyContext(this.container);
        ctx.tenancy = new TenancyLegacyContext(this.container);
        ctx.wcp = new LegacyWcpContext(this.container);
    }
}

export const ApiCoreContextEnhancer = GraphQLContextEnhancer.createImplementation({
    implementation: ApiCoreContextEnhancerImpl,
    dependencies: [RequestContainer]
});

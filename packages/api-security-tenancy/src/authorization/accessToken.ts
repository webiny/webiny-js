import { TenancyContext } from "@webiny/api-security-tenancy/types";
import { SecurityContext } from "@webiny/api-security/types";

type AccessTokenAuthorization = {
    identityType?: string;
};

export default (config: AccessTokenAuthorization = {}) => ({
    type: "security-authorization",
    async getPermissions({ security }: SecurityContext & TenancyContext) {
        const identityType = config.identityType || "access-token";
        
        const identity = security.getIdentity();
        const tenant = security.getTenant();

        if (identity && identity.type === identityType) {
            // TODO: implement Access Token authorization
        }
    }
});

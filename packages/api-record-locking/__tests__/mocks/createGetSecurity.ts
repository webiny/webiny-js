import type { IIdentityContext } from "@webiny/api-core/features/IdentityContext";

export const createGetSecurity = () => {
    return (): { withoutAuthorization: IIdentityContext["withoutAuthorization"] } => {
        return {
            withoutAuthorization: async cb => {
                return await cb();
            }
        };
    };
};

import { SecurityContext, SecurityIdentity } from "@webiny/api-security/types";

export const mockSecurity = (identity: SecurityIdentity, context: SecurityContext) => {
    context.security.disableAuthorization();
    context.security.setIdentity(identity);
};

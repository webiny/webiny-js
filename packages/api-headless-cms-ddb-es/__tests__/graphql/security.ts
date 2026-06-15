import { ContextPlugin } from "@webiny/api";
import { Tenant } from "@webiny/api-core/types/tenancy";

import type { CmsContext } from "~/types";
import apiKeyAuthentication from "@webiny/api-core/legacy/security/plugins/apiKeyAuthentication.js";
import apiKeyAuthorization from "@webiny/api-core/legacy/security/plugins/apiKeyAuthorization.js";

export const createSecurity = () => {
    return [
        new ContextPlugin<CmsContext>(context => {
            context.tenancy.setCurrentTenant({
                id: "root",
                name: "Root"
            } as Tenant);

            context.security.addAuthenticator(async () => {
                return {
                    id: "id-12345678",
                    type: "admin",
                    displayName: "John Doe"
                };
            });

            context.security.addAuthorizer(async () => {
                const { headers = {} } = context.request || {};
                if (headers["authorization"]) {
                    return null;
                }

                return [{ name: "*" }];
            });
        }),
        new ContextPlugin<CmsContext>(context => {
            const { headers = {} } = context.request || {};
            if (headers["authorization"]) {
                return context.security.authenticate(headers["authorization"]);
            }

            return context.security.authenticate("");
        }),
        apiKeyAuthentication({ identityType: "api-key" }),
        apiKeyAuthorization({ identityType: "api-key" })
    ];
};

import { ContextPlugin } from "@webiny/api";
import { Tenant } from "@webiny/api-core/types/tenancy";

import type { CmsContext } from "~/types";

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
                return [{ name: "*" }];
            });
        }),
        new ContextPlugin<CmsContext>(async context => {
            await context.security.authenticate("");
        })
    ];
};

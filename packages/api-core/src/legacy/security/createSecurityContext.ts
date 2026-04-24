import { ContextPlugin } from "@webiny/api";
import type { ApiCoreContext } from "~/types/core.js";
import { LegacyContext } from "~/legacy/security/LegacyContext.js";
import { createSecurityGraphQL } from "~/graphql/security/index.js";

export const createSecurityContext = () => {
    return new ContextPlugin<ApiCoreContext>(async context => {
        // Create a legacy context that delegates to new features
        context.security = new LegacyContext(context.container);

        // Register GraphQL plugins
        context.plugins.register(createSecurityGraphQL());
    });
};

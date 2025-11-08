import { ContextPlugin } from "@webiny/api";
import type { ApiCoreContext } from "~/types/core.js";

export interface Config {
    identityType?: string;
}

export default ({ identityType }: Config) => {
    return new ContextPlugin<ApiCoreContext>(context => {
        context.security.addAuthenticator(async token => {
            if (typeof token !== "string" || !token.startsWith("a")) {
                return null;
            }

            const apiKey = await context.security.withoutAuthorization(() => {
                return context.security.getApiKeyByToken(token);
            });

            if (!apiKey) {
                return null;
            }

            return {
                id: apiKey.id,
                displayName: apiKey.name,
                type: identityType || "api-key",
                // Add permissions directly to the identity so we don't have to load them
                // again when authorization kicks in.
                permissions: apiKey.permissions
            };
        });
    });
};

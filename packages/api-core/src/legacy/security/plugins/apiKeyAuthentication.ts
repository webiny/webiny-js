import { ContextPlugin } from "@webiny/api";
import type { ApiCoreContext } from "~/types/core.js";
import { ApiKeysRepository } from "~/features/security/apiKeys/shared/abstractions.js";

export interface Config {
    identityType?: string;
}

export default ({ identityType }: Config) => {
    return new ContextPlugin<ApiCoreContext>(context => {
        context.security.addAuthenticator(async token => {
            if (typeof token !== "string" || !token.startsWith("wat_")) {
                return null;
            }

            const repository = context.container.resolve(ApiKeysRepository);
            const result = await repository.getByToken(token);

            if (!result.isOk()) {
                return null;
            }

            const apiKey = result.value;

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

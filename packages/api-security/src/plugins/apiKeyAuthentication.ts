import { Context as HandlerContext } from "@webiny/handler/types";
import { HttpContext } from "@webiny/handler-http/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { SecurityContext } from "~/types";
type Context = HandlerContext<HttpContext, SecurityContext>;

export interface Config {
    identityType?: string;
}

export default ({ identityType }: Config) => {
    return new ContextPlugin<Context>(context => {
        context.security.addAuthenticator(async token => {
            if (!token.startsWith("a")) {
                return;
            }

            const apiKey = await context.security.getApiKeyByToken(token);

            if (apiKey) {
                return {
                    id: apiKey.id,
                    displayName: apiKey.name,
                    type: identityType || "api-key",
                    // Add permissions directly to the identity so we don't have to load them
                    // again when authorization kicks in.
                    permissions: apiKey.permissions
                };
            }
        });
    });
};

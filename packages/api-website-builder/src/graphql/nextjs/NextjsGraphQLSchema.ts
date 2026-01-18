import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import NotAuthorizedResponse from "@webiny/api-core/graphql/security/NotAuthorizedResponse.js";
import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";
import { NextjsConfig } from "~/features/nextjs/index.js";

class Schema implements CoreGraphQLSchemaFactory.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private config: NextjsConfig.Interface
    ) {}

    execute(): CoreGraphQLSchemaFactory.Return {
        return [
            {
                typeDefs: /* GraphQL */ `
                    type NextjsConfigResponse {
                        data: String
                        error: WbError
                    }

                    extend type WbQuery {
                        getNextjsConfig: NextjsConfigResponse
                    }
                `,
                resolvers: {
                    WbQuery: {
                        getNextjsConfig: async () => {
                            const identity = this.identityContext.getIdentity();
                            if (!identity.isAdmin()) {
                                return new NotAuthorizedResponse();
                            }

                            const permission =
                                await this.identityContext.getPermission("wb.settings");
                            if (!permission) {
                                // TODO: create settings error classes
                                return new ErrorResponse({
                                    code: "WebsiteBuilder/Settings/NotAuthorized",
                                    message: "Not authorized!"
                                });
                            }

                            const config = await this.config.execute();

                            return new Response(config.build());
                        }
                    }
                }
            }
        ];
    }
}

export const NextjsGraphQLSchema = CoreGraphQLSchemaFactory.createImplementation({
    implementation: Schema,
    dependencies: [IdentityContext, NextjsConfig]
});

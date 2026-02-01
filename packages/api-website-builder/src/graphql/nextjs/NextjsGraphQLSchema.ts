import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import NotAuthorizedResponse from "@webiny/api-core/graphql/security/NotAuthorizedResponse.js";
import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";
import { NextjsConfig } from "~/features/nextjs/index.js";
import { GraphQLSchemaBuilder } from "@webiny/handler-graphql/features/GraphQLSchemaBuilder/abstractions.js";

class Schema implements CoreGraphQLSchemaFactory.Interface {
    public async execute(builder: GraphQLSchemaBuilder.Interface): CoreGraphQLSchemaFactory.Return {
        builder.addTypeDefs(/* GraphQL */ `
            type NextjsConfigResponse {
                data: String
                error: WbError
            }

            extend type WbQuery {
                getNextjsConfig: NextjsConfigResponse
            }
        `);

        builder.addResolver({
            dependencies: [IdentityContext, NextjsConfig],
            path: "WbQuery.getNextjsConfig",
            resolver(
                identityContext: IdentityContext.Interface,
                nextJsConfig: NextjsConfig.Interface
            ) {
                return async () => {
                    const identity = identityContext.getIdentity();
                    if (!identity.isAdmin()) {
                        return new NotAuthorizedResponse();
                    }

                    const permission = await identityContext.getPermission("wb.settings");
                    if (!permission) {
                        // TODO: create settings error classes
                        return new ErrorResponse({
                            code: "WebsiteBuilder/Settings/NotAuthorized",
                            message: "Not authorized!"
                        });
                    }

                    const config = await nextJsConfig.execute();

                    return new Response(config.build());
                };
            }
        });

        return builder;
    }
}

export const NextjsGraphQLSchema = CoreGraphQLSchemaFactory.createImplementation({
    implementation: Schema,
    dependencies: []
});

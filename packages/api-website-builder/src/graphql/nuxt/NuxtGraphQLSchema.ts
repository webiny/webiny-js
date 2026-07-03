import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import NotAuthorizedResponse from "@webiny/api-core/graphql/security/NotAuthorizedResponse.js";
import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";
import { NuxtConfig } from "~/features/nuxt/index.js";
import { GraphQLSchemaBuilder } from "@webiny/handler-graphql/features/GraphQLSchemaBuilder/abstractions.js";

class Schema implements CoreGraphQLSchemaFactory.Interface {
    public async execute(builder: GraphQLSchemaBuilder.Interface): CoreGraphQLSchemaFactory.Return {
        builder.addTypeDefs(/* GraphQL */ `
            type NuxtConfigResponse {
                data: String
                error: WbError
            }

            extend type WbQuery {
                getNuxtConfig: NuxtConfigResponse
            }
        `);

        builder.addResolver({
            dependencies: [IdentityContext, NuxtConfig],
            path: "WbQuery.getNuxtConfig",
            resolver(identityContext: IdentityContext.Interface, nuxtConfig: NuxtConfig.Interface) {
                return async () => {
                    const identity = identityContext.getIdentity();
                    if (!identity.isAdmin()) {
                        return new NotAuthorizedResponse();
                    }

                    const permission = await identityContext.getPermission("wb.settings");
                    if (!permission) {
                        return new ErrorResponse({
                            code: "WebsiteBuilder/Settings/NotAuthorized",
                            message: "Not authorized!"
                        });
                    }

                    const config = await nuxtConfig.execute();

                    return new Response(config.build());
                };
            }
        });

        return builder;
    }
}

export const NuxtGraphQLSchema = CoreGraphQLSchemaFactory.createImplementation({
    implementation: Schema,
    dependencies: []
});

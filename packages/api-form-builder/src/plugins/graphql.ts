import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { FormBuilderContext } from "~/types";

const emptyResolver = () => ({});

const plugin: GraphQLSchemaPlugin<FormBuilderContext> = {
    type: "graphql-schema",
    name: "graphql-schema-formBuilder",
    schema: {
        typeDefs: /* GraphQL */ `
            type FbBooleanResponse {
                data: Boolean
                error: FbError
            }

            type FbQuery {
                # Get installed version
                version: String
            }

            type FbMutation {
                # Install Form Builder
                install(domain: String): FbBooleanResponse

                # Upgrade Form Builder
                upgrade(version: String!): FbBooleanResponse
            }

            extend type Query {
                formBuilder: FbQuery
            }

            extend type Mutation {
                formBuilder: FbMutation
            }

            type FbError {
                code: String
                message: String
                data: JSON
                stack: String
            }

            type FbDeleteResponse {
                data: Boolean
                error: FbError
            }
        `,
        resolvers: {
            Query: {
                formBuilder: emptyResolver
            },
            Mutation: {
                formBuilder: emptyResolver
            },
            FbQuery: {
                version: async (_, __, context) => {
                    const { i18n, tenancy, formBuilder } = context;

                    if (!tenancy.getCurrentTenant() || !i18n.getContentLocale()) {
                        return null;
                    }

                    try {
                        return formBuilder.getSystemVersion();
                    } catch (e) {
                        return new ErrorResponse({
                            code: "FORM_BUILDER_ERROR",
                            message: e.message,
                            data: e.data
                        });
                    }
                }
            },
            FbMutation: {
                install: async (_, args: any, context) => {
                    try {
                        await context.formBuilder.installSystem({ domain: args.domain });

                        return new Response(true);
                    } catch (e) {
                        return new ErrorResponse({
                            code: "FORM_BUILDER_ERROR",
                            message: e.message,
                            data: e.data
                        });
                    }
                },
                upgrade: async (_, args: any, context) => {
                    try {
                        await context.formBuilder.upgradeSystem(args.version as string);

                        return new Response(true);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                }
            }
        }
    }
};

export default plugin;

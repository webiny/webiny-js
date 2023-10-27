import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { FormBuilderContext } from "~/types";

const emptyResolver = () => ({});

export const createBaseSchema = () => {
    const baseSchema = new GraphQLSchemaPlugin<FormBuilderContext>({
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
                }
            }
        }
    });

    return baseSchema;
};

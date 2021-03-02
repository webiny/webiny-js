import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { FormBuilderContext, Settings } from "../types";
import defaults from "./crud/defaults";

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
                version: async (root, args, context) => {
                    const { i18nContent, security, formBuilder } = context;

                    if (!security.getTenant() || !i18nContent.getLocale()) {
                        return false;
                    }

                    try {
                        return formBuilder.system.getVersion();
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
                install: async (root, args, context) => {
                    const { formBuilder, elasticSearch } = context;

                    try {
                        const version = await formBuilder.system.getVersion();
                        if (version) {
                            return new ErrorResponse({
                                code: "FORM_BUILDER_INSTALL_ABORTED",
                                message: "Form builder is already installed."
                            });
                        }

                        // Prepare "settings" data
                        const data: Partial<Settings> = {};

                        if (args.domain) {
                            data.domain = args.domain;
                        }

                        await formBuilder.settings.createSettings(data);

                        // Create ES index if it doesn't already exist.
                        const esIndex = defaults.es(context);
                        const { body: exists } = await elasticSearch.indices.exists(esIndex);
                        if (!exists) {
                            await elasticSearch.indices.create(esIndex);
                        }

                        await formBuilder.system.setVersion(context.WEBINY_VERSION);

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
    }
};

export default plugin;

import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { FormBuilderContext, Settings } from "../types";
import { ErrorResponse, Response } from "@webiny/handler-graphql";

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
                # Is Form Builder installed?
                isInstalled: FbBooleanResponse
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
                isInstalled: async (root, args, context) => {
                    const { i18nContent, security } = context;

                    if (!security.getTenant() || !i18nContent.getLocale()) {
                        return false;
                    }

                    try {
                        const settings = await context.formBuilder.settings.getSettings();
                        if (!settings) {
                            return new Response(false);
                        }

                        return new Response(Boolean(settings.installed));
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
                    const { formBuilder } = context;

                    try {
                        const existingSettings = await formBuilder.settings.getSettings();
                        if (existingSettings && existingSettings.installed) {
                            return new ErrorResponse({
                                code: "FORM_BUILDER_INSTALL_ABORTED",
                                message: "Form builder is already installed."
                            });
                        }

                        // Prepare "settings" data
                        const data: Partial<Settings> = {
                            installed: true
                        };

                        if (args.domain) {
                            data.domain = args.domain;
                        }

                        if (!existingSettings) {
                            await formBuilder.settings.createSettings(data);
                        } else {
                            await formBuilder.settings.updateSettings(data);
                        }

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

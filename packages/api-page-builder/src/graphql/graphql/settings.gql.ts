import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { PbContext } from "~/types";

export const createSettingsGraphQL = (): GraphQLSchemaPlugin<PbContext> => {
    return {
        type: "graphql-schema",
        schema: {
            typeDefs: /* GraphQL */ `
                type PbSettingsError {
                    code: String
                    message: String
                    data: JSON
                }

                type PbSocialMedia {
                    facebook: String
                    twitter: String
                    instagram: String
                    image: PbFile
                }

                type PbSettingsPrerenderingStorage {
                    name: String
                }

                type PbSettingsPrerenderingApp {
                    url: String
                }

                type PbSettingsPrerendering {
                    storage: PbSettingsPrerenderingStorage
                    app: PbSettingsPrerenderingApp
                }

                type PbSettings {
                    name: String
                    favicon: PbFile
                    logo: PbFile
                    websiteUrl: String
                    websitePreviewUrl: String
                    social: PbSocialMedia
                    pages: PbSettingsPages
                    prerendering: PbSettingsPrerendering
                }

                type PbSettingsResponse {
                    # This field's value is hardcoded and it's here to help frontend clients cache data more easily.
                    id: ID
                    error: PbSettingsError
                    data: PbSettings
                }

                type PbDefaultSettingsResponse {
                    # This field's value is hardcoded and it's here to help frontend clients cache data more easily.
                    id: ID
                    error: PbSettingsError
                    data: PbSettings
                }

                type PbSettingsPages {
                    home: ID
                    notFound: ID
                }

                type PbDefaultPage {
                    id: String
                    parent: String
                    title: String
                }

                input PbSettingsPrerenderingStorageInput {
                    name: String
                }

                input PbSettingsPrerenderingAppInput {
                    url: String
                }

                input PbSettingsPrerenderingInput {
                    storage: PbSettingsPrerenderingStorageInput
                    app: PbSettingsPrerenderingAppInput
                }

                input PbSocialMediaInput {
                    facebook: String
                    twitter: String
                    instagram: String
                    image: PbFileInput
                }

                input PbDefaultPageInput {
                    id: String
                    title: String
                }

                input PbSettingsInput {
                    name: String
                    websiteUrl: String
                    websitePreviewUrl: String
                    favicon: PbFileInput
                    logo: PbFileInput
                    social: PbSocialMediaInput
                    pages: PbSettingsPagesInput
                    prerendering: PbSettingsPrerenderingInput
                }

                input PbSettingsPagesInput {
                    home: ID
                    notFound: ID
                }

                extend type PbQuery {
                    # Returns settings for current locale and tenant (uses defaults).
                    getCurrentSettings: PbSettingsResponse

                    # Returns settings for current locale and tenant (does not use defaults).
                    getSettings: PbSettingsResponse

                    # Returns default settings that are composed of the default settings for all tenants,
                    # overwritten by the default settings for the current tenant. Use a value from these
                    # settings if it hasn't been returned by the base getSettings field.
                    getDefaultSettings: PbDefaultSettingsResponse
                }

                extend type PbMutation {
                    updateSettings(data: PbSettingsInput!): PbSettingsResponse
                }
            `,
            resolvers: {
                PbSettingsResponse: {
                    id: (_, __, context) => {
                        return context.pageBuilder.getSettingsCacheKey();
                    }
                },
                PbDefaultSettingsResponse: {
                    id: (_, __, context) => {
                        return context.pageBuilder.getSettingsCacheKey({
                            tenant: false,
                            locale: false
                        });
                    }
                },
                PbQuery: {
                    getCurrentSettings: async (_, __, context) => {
                        try {
                            return new Response(await context.pageBuilder.getCurrentSettings());
                        } catch (err) {
                            return new ErrorResponse(err);
                        }
                    },
                    getSettings: async (_, __, context) => {
                        try {
                            return new Response(await context.pageBuilder.getSettings());
                        } catch (err) {
                            return new ErrorResponse(err);
                        }
                    },
                    getDefaultSettings: async (_, __, context) => {
                        try {
                            return new Response(await context.pageBuilder.getDefaultSettings());
                        } catch (err) {
                            return new ErrorResponse(err);
                        }
                    }
                },
                PbMutation: {
                    updateSettings: async (_, args, context) => {
                        try {
                            return new Response(
                                await context.pageBuilder.updateSettings(args.data)
                            );
                        } catch (err) {
                            return new ErrorResponse(err);
                        }
                    }
                }
            }
        }
    };
};

import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { hasI18NContentPermission } from "@webiny/api-i18n-content";
import { hasPermission } from "@webiny/api-security";
import { compose } from "@webiny/handler-graphql";
import { PbContext } from "@webiny/api-page-builder/types";

const plugin: GraphQLSchemaPlugin<PbContext> = {
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

            type PbSettings {
                name: String
                favicon: PbFile
                logo: PbFile
                domain: String
                social: PbSocialMedia
                pages: PbSettingsPages
            }

            type PbSettingsResponse {
                # This field's value is hardcoded and it's here to help frontend clients cache data more easily.
                id: ID
                error: PbSettingsError
                data: PbSettings
            }

            type PbSettingsPages {
                home: ID
                notFound: ID
                error: ID
            }

            type PbDefaultPage {
                id: String
                parent: String
                title: String
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
                domain: String
                favicon: PbFileInput
                logo: PbFileInput
                social: PbSocialMediaInput
                pages: PbSettingsPagesInput
            }

            input PbSettingsPagesInput {
                home: ID
                notFound: ID
                error: ID
            }

            extend type PbQuery {
                getSettings: PbSettingsResponse
            }

            extend type PbMutation {
                updateSettings(data: PbSettingsInput!): PbSettingsResponse
            }
        `,
        resolvers: {
            PbSettingsResponse: {
                id: (_, args, context) => {
                    const { i18nContent } = context;
                    return `${i18nContent?.locale?.code}#pb-settings`;
                }
            },
            PbQuery: {
                getSettings: compose(
                    hasPermission("pb.settings"),
                    hasI18NContentPermission()
                )(async (_, args, context: PbContext) => {
                    try {
                        const { settings } = context;
                        return new Response(await settings.get());
                    } catch (err) {
                        return new ErrorResponse(err);
                    }
                })
            },
            PbMutation: {
                updateSettings: compose(
                    hasPermission("pb.settings"),
                    hasI18NContentPermission()
                )(async (_, args, context: PbContext) => {
                    try {
                        const { settings } = context;
                        return new Response(await settings.update(args.data));
                    } catch (err) {
                        return new ErrorResponse(err);
                    }
                })
            }
        }
    }
};

export default plugin;

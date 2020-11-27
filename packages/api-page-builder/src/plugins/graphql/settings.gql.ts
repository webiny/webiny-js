import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { Context as HandlerContext } from "@webiny/handler/types";
import { I18NContext } from "@webiny/api-i18n/types";
import { SecurityContext } from "@webiny/api-security/types";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { hasI18NContentPermission } from "@webiny/api-i18n-content";
import { hasPermission } from "@webiny/api-security";
import { compose } from "@webiny/handler-graphql";

type Context = HandlerContext<I18NContext, SecurityContext>;

const plugin: GraphQLSchemaPlugin<Context> = {
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
                image: JSON
            }

            type PbSettings {
                name: String
                favicon: JSON
                logo: JSON
                domain: String
                social: PbSocialMedia
                pages: PbSettingsPages
            }

            type PbSettingsResponse {
                error: PbSettingsError
                id: ID
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
                image: RefInput
            }

            input PbDefaultPageInput {
                id: String
                title: String
            }

            input PbSettingsInput {
                name: String
                domain: String
                favicon: RefInput
                logo: RefInput
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
            PbQuery: {
                getSettings: compose(
                    hasPermission("pb.settings"),
                    hasI18NContentPermission()
                )(async (_, args, context: Context) => {
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
                )(async (_, args, context: Context) => {
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

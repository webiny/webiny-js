// @flow
import { resolveSaveSettings, resolveGetSettings } from "webiny-api/graphql";

export default {
    name: "graphql-schema-settings-cms",
    type: "graphql-schema",
    typeDefs: /* GraphQL */ `
        type CmsSettingsError {
            code: String
            message: String
            data: JSON
        }

        type CmsSocialMedia {
            facebook: String
            twitter: String
            instagram: String
            image: File
        }

        type CmsSettings {
            name: String
            favicon: File
            logo: File
            domain: String
            social: CmsSocialMedia
            pages: CmsSettingsPages
        }

        type CmsSettingsResponse {
            error: CmsSettingsError
            data: CmsSettings
        }

        type CmsSettingsPages {
            home: ID
            notFound: ID
            error: ID
        }

        type CmsDefaultPage {
            id: String
            parent: String
            title: String
        }

        input CmsSocialMediaInput {
            facebook: String
            twitter: String
            instagram: String
            # TODO: image: FileInput
        }

        input CmsDefaultPageInput {
            id: String
            title: String
        }

        input CmsSettingsInput {
            name: String
            #favicon: FileInput
            #logo: FileInput
            social: CmsSocialMediaInput
            pages: CmsSettingsPagesInput
        }

        input CmsSettingsPagesInput {
            home: ID
            notFound: ID
            error: ID
        }

        extend type SettingsQuery {
            cms: CmsSettingsResponse
        }

        extend type SettingsMutation {
            cms(data: CmsSettingsInput): CmsSettingsResponse
        }
    `,
    resolvers: {
        CmsSocialMedia: {
            image({ image }) {
                return { __typename: "File", id: image };
            }
        },
        CmsSettings: {
            favicon({ favicon }) {
                return { __typename: "File", id: favicon };
            },
            logo({ logo }) {
                return { __typename: "File", id: logo };
            }
        },
        SettingsQuery: {
            cms: (_: any, args: Object, ctx: Object, info: Object) => {
                const entity = ctx.getEntity("CmsSettings");
                return resolveGetSettings(entity)(_, args, ctx, info);
            }
        },
        SettingsMutation: {
            cms: (_: any, args: Object, ctx: Object, info: Object) => {
                const entity = ctx.getEntity("CmsSettings");
                return resolveSaveSettings(entity)(_, args, ctx, info);
            }
        }
    }
};

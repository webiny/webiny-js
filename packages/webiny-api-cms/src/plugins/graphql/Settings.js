// @flow
import { resolveUpdateSettings, resolveGetSettings } from "webiny-api/graphql";

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
        
        extend type CmsQuery {
            getSettings: CmsSettingsResponse
        }   
        
        extend type CmsMutation {
            updateSettings(data: CmsSettingsInput): CmsSettingsResponse
        }
    `,
    resolvers: {
        CmsQuery: {
            getSettings: resolveGetSettings("CmsSettings")
        },
        CmsMutation: {
            updateSettings: resolveUpdateSettings("CmsSettings")
        },
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
        }
    }
};

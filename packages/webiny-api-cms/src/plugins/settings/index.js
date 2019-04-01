// @flow
import { cmsSettingsFactory } from "webiny-api-cms/entities";

export default [
    {
        name: "schema-settings-cms",
        type: "schema-settings",
        namespace: "cms",
        typeDefs: /* GraphQL */ `
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
                error: Error
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
                image: FileInput
            }

            input CmsDefaultPageInput {
                id: String
                title: String
            }

            input CmsSettingsInput {
                name: String
                favicon: FileInput
                logo: FileInput
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
        entity: ({
            cms: {
                entities: { CmsSettings }
            }
        }: Object) => CmsSettings
    },
    {
        type: "entity",
        name: "entity-cms-settings",
        namespace: "cms",
        entity: {
            name: "CmsSettings",
            factory: cmsSettingsFactory
        }
    }
];

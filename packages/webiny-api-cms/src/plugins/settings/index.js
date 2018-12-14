// @flow
import { cmsSettingsFactory } from "webiny-api-cms/entities";

export default [
    {
        name: "schema-settings-cms",
        type: "schema-settings",
        namespace: "cms",
        typeDefs: /* GraphQL */ `
            type CmsSettings {
                pages: CmsSettingsPages
            }

            type CmsSettingsPages {
                home: CmsDefaultPage
                notFound: CmsDefaultPage
                error: CmsDefaultPage
            }

            type CmsDefaultPage {
                id: String
                title: String
            }

            input CmsDefaultPageInput {
                id: String
                title: String
            }

            input CmsSettingsInput {
                pages: CmsSettingsPagesInput
            }

            input CmsSettingsPagesInput {
                home: ID
                notFound: ID
                error: ID
            }

            extend type SettingsQuery {
                cms: CmsSettings
            }

            extend type SettingsMutation {
                cms(data: CmsSettingsInput): CmsSettings
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

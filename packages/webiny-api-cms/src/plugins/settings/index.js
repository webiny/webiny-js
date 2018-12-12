// @flow
import { Model } from "webiny-model";
import { EntityModel } from "webiny-entity";

import { settingsFactory } from "webiny-api/entities";

const cmsSettingsPagesModelFactory = (settings, { cms: { entities } }) => {
    return class CmsSettingsModel extends EntityModel {
        constructor() {
            super();
            this.setParentEntity(settings);
            this.attr("home").entity(entities.Page);
            this.attr("notFound").entity(entities.Page);
        }
    };
};

const cmsSettingsModelFactory = (...args) => {
    return class CmsSettingsModel extends Model {
        constructor() {
            super();
            this.attr("pages").model(cmsSettingsPagesModelFactory(...args));
        }
    };
};

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
            factory: (...args: Array<any>) => {
                return class CmsSettings extends settingsFactory(...args) {
                    static key = "cms";

                    data: Object;
                    load: Function;

                    constructor() {
                        super();
                        this.attr("data").model(cmsSettingsModelFactory(this, ...args));
                    }
                };
            }
        }
    }
];

// @flow
import { settingsFactory } from "webiny-api/entities";

import { Model } from "webiny-model";
import { EntityModel } from "webiny-entity";

const cmsSettingsPagesModelFactory = (settings, { cms: { entities } }) => {
    return class CmsSettingsModel extends EntityModel {
        constructor() {
            super();
            this.setParentEntity(settings);
            this.attr("home").entity(entities.Page);
            this.attr("notFound").entity(entities.Page);
            this.attr("error").entity(entities.Page);
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

export const cmsSettingsFactory = (...args) => {
    return class CmsSettings extends settingsFactory(...args) {
        static key = "cms";

        data: Object;
        load: Function;

        constructor() {
            super();
            this.attr("data").model(cmsSettingsModelFactory(this, ...args));
        }
    };
};

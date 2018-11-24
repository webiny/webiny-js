// @flow
import { Entity } from "webiny-entity";
import { settingsFactory } from "webiny-api/entities/Settings.entity";
import cmsSettingsDataModelFactory from "./CmsSettings.model";

export interface ICmsSettings extends Entity {}

export function cmsSettingsFactory({ entities, user }: Object): Class<ICmsSettings> {
    class CmsSettings extends settingsFactory({ entities, user }) {
        static key = "cms";

        constructor() {
            super();
            this.attr("data").model(cmsSettingsDataModelFactory());
        }
    }

    return CmsSettings;
}

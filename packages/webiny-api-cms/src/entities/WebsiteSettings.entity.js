// @flow
import { Entity } from "webiny-entity";
import { settingsFactory } from "webiny-api/entities/Settings.entity";
import websiteSettingsDataModelFactory from "./WebsiteSettings.model";

export interface IWebsiteSettings extends Entity {}

export function websiteSettingsFactory({ entities, user }: Object): Class<IWebsiteSettings> {
    class WebsiteSettings extends settingsFactory({ entities, user }) {
        static key = "website-settings";

        constructor() {
            super();
            this.attr("data").model(websiteSettingsDataModelFactory());
        }
    }

    return WebsiteSettings;
}

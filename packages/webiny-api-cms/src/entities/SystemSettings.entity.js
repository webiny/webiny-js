// @flow
import { Entity } from "webiny-entity";
import { settingsFactory } from "webiny-api/entities/Settings.entity";
import systemSettingsDataModelFactory from "./SystemSettings.model";

export interface ISystemSettings extends Entity {}

export function systemSettingsFactory({ entities, user }: Object): Class<ISystemSettings> {
    class SystemSettings extends settingsFactory({ entities, user }) {
        static key = "system-settings";

        constructor() {
            super();
            this.attr("data").model(systemSettingsDataModelFactory());
        }
    }

    return SystemSettings;
}

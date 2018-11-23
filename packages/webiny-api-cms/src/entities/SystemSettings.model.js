// @flow
import { Model } from "webiny-model";
import { getPlugins } from "webiny-api/plugins";

export interface ISystemSettingsSettings extends Model {}

export default function systemSettingsSettingsFactory(): Class<ISystemSettingsSettings> {
    return class SystemSettingsSettingsModel extends Model {
        constructor() {
            super();

            getPlugins("cms-system-settings-model").forEach(pl => {
                pl.apply({ model: this });
            });
        }
    };
}

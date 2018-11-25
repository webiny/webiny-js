// @flow
import { Model } from "webiny-model";
import { getPlugins } from "webiny-api/plugins";

export interface ICmsSettings extends Model {}

export default function cmsSettingsFactory(): Class<ICmsSettings> {
    return class CmsSettingsModel extends Model {
        constructor() {
            super();

            getPlugins("cms-settings-model").forEach(plugin => {
                Object.keys(plugin.model).forEach(name => {
                    this.attr(name).model(plugin.model[name]);
                });
            });
        }
    };
}

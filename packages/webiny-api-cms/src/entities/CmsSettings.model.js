// @flow
import { Model } from "webiny-model";
import { getPlugins } from "webiny-api/plugins";

export interface ICmsSettings extends Model {}

export default function cmsSettingsFactory(): Class<ICmsSettings> {
    return class CmsSettingsModel extends Model {
        constructor() {
            super();

            getPlugins("cms-settings-model").forEach(plugin => {
                this.attr(plugin.name).model(plugin.model);
            });
        }
    };
}

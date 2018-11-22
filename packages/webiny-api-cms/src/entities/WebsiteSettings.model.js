// @flow
import { Model } from "webiny-model";
import { getPlugins } from "webiny-api/plugins";

export interface IWebsiteSettingsSettings extends Model {}

export default function websiteSettingsSettingsFactory(): Class<IWebsiteSettingsSettings> {
    return class WebsiteSettingsSettingsModel extends Model {
        constructor() {
            super();

            getPlugins("cms-website-settings-model").forEach(pl => {
                pl.apply({ model: this });
            });
        }
    };
}

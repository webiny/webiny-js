// @flow
import { EntityModel } from "webiny-entity";
import { getPlugins } from "webiny-api/plugins";

export default class PageSettingsModel extends EntityModel {
    constructor() {
        super();

        getPlugins("cms-page-settings-model").forEach(pl => {
            pl.apply(this);
        });
    }
}

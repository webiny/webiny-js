// @flow
import { EntityModel } from "webiny-entity";
import { getPlugins } from "webiny-plugins";

export interface IPageSettings extends EntityModel {}

export default function pageSettingsFactory({ getEntity, page }: Object): Class<IPageSettings> {
    return class PageSettingsModel extends EntityModel {
        constructor() {
            super();
            this.setParentEntity(page);

            getPlugins("cms-page-settings-model").forEach(pl => {
                pl.apply({ model: this, page, getEntity });
            });
        }
    };
}

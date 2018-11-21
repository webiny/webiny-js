// @flow
import { EntityModel } from "webiny-entity";
import { getPlugins } from "webiny-api/plugins";

export interface IPageSettings extends EntityModel {}

export default function pageSettingsFactory({ entities, page }: Object): Class<IPageSettings> {
    return class PageSettingsModel extends EntityModel {
        constructor() {
            super();
            this.setParentEntity(page);

            getPlugins("cms-page-settings-model").forEach(pl => {
                pl.apply({ model: this, page, entities });
            });
        }
    };
}

// @flow
import { EntityModel } from "@webiny/entity";

export interface IPageSettings extends EntityModel {}

export default function pageSettingsFactory({ context, page }: Object): Class<IPageSettings> {
    return class PageSettingsModel extends EntityModel {
        constructor() {
            super();
            this.setParentEntity(page);

            context.plugins.byType("pb-page-settings-model").forEach(pl => {
                pl.apply({ model: this, page, getEntity: context.getEntity });
            });
        }
    };
}

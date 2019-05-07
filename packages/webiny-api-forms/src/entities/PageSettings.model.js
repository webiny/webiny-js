// @flow
import { EntityModel } from "webiny-entity";
import { getPlugins } from "webiny-plugins";

export interface IFormSettings extends EntityModel {}

export default function formSettingsFactory({ entities, form }: Object): Class<IFormSettings> {
    return class FormSettingsModel extends EntityModel {
        constructor() {
            super();
            this.setParentEntity(form);

            getPlugins("forms-form-settings-model").forEach(pl => {
                pl.apply({ model: this, form, entities });
            });
        }
    };
}

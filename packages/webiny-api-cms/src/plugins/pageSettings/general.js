// @flow
import { EntityModel } from "webiny-entity";

class GeneralSettings extends EntityModel {
    constructor() {
        super();
        this.attr("tags").array();
        this.attr("layout").char();
    }
}

export default [
    {
        name: "cms-page-settings-general",
        type: "cms-page-settings-model",
        apply(model: EntityModel) {
            model
                .attr("general")
                .model(GeneralSettings)
                .setDefaultValue({});
        }
    },
    {
        name: "cms-schema-settings-general",
        type: "cms-schema",
        typeDefs: `
            type GeneralSettings {
                tags: [String]
                layout: String
            } 
            
            extend type PageSettings {
                general: GeneralSettings
            }
        `
    }
];

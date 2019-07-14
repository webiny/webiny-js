// @flow
import { EntityModel } from "webiny-entity";

const createGeneralSettingsModel = context =>
    class GeneralSettings extends EntityModel {
        constructor() {
            super();
            this.setParentEntity(context.page);
            this.attr("tags").array();
            this.attr("layout").char();
            this.attr("image").entity(context.files.entities.File);
        }
    };

export default [
    {
        name: "cms-page-settings-general",
        type: "cms-page-settings-model",
        apply(context: Object) {
            context.model
                .attr("general")
                .model(createGeneralSettingsModel(context))
                .setDefaultValue({});
        }
    },
    {
        name: "cms-schema-settings-general",
        type: "cms-schema",
        typeDefs: `
            type GeneralPageSettings {
                tags: [String]
                layout: String
                image: File
            } 
            
            extend type PageSettings {
                general: GeneralPageSettings
            }
        `
    }
];

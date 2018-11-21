// @flow
import { EntityModel } from "webiny-entity";
import { Model } from "webiny-model";

class FileModel extends Model {
    name: string;
    size: number;
    src: string;
    type: string;
    constructor() {
        super();
        this.attr("name").char();
        this.attr("size").integer();
        this.attr("src").char();
        this.attr("type").char();
    }
}

const generalSettingsFactory = ({ entities, page }: Object) => {
    return class GeneralSettings extends EntityModel {
        constructor() {
            super();
            this.setParentEntity(page);
            this.attr("tags")
                .entities(entities.Tag, "page")
                .setUsing(entities.Tags2Pages, "tag");

            this.attr("layout").char();
            this.attr("image").model(FileModel);
        }
    };
};

export default [
    {
        name: "cms-page-settings-general",
        type: "cms-page-settings-model",
        apply({ entities, model, page }: Object) {
            model
                .attr("general")
                .model(generalSettingsFactory({ entities, page }))
                .setDefaultValue({});
        }
    },
    {
        name: "cms-schema-settings-general",
        type: "cms-schema",
        typeDefs: `
            type GeneralSettings {
                tags: [Tag]
                layout: String
                image: File
            } 
            
            extend type PageSettings {
                general: GeneralSettings
            }
        `
    }
];

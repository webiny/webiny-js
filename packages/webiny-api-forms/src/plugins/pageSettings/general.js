// @flow
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

class GeneralSettings extends Model {
    constructor() {
        super();
        this.attr("tags").array();
        this.attr("layout").char();
        this.attr("image").model(FileModel);
    }
}

export default [
    {
        name: "forms-form-settings-general",
        type: "forms-form-settings-model",
        apply({ model }: Object) {
            model
                .attr("general")
                .model(GeneralSettings)
                .setDefaultValue({});
        }
    },
    {
        name: "forms-schema-settings-general",
        type: "forms-schema",
        typeDefs: `
            type GeneralFormSettings {
                tags: [String]
                layout: String
                image: File
            } 
            
            extend type FormSettings {
                general: GeneralFormSettings
            }
        `
    }
];

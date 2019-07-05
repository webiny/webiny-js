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
        name: "cms-page-settings-general",
        type: "cms-page-settings-model",
        apply({ model }: Object) {
            model
                .attr("general")
                .model(GeneralSettings)
                .setDefaultValue({});
        }
    },
    {
        name: "cms-schema-settings-general",
        type: "graphql-schema-plugin-cms",
        typeDefs: `
            type GeneralPageSettings {
                tags: [String]
                layout: String
                image: File
            } 
            
            extend type PageBuilderPageSettings {
                general: GeneralPageSettings
            }
        `
    }
];

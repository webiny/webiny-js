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

class OpenGraphTagModel extends EntityModel {
    constructor() {
        super();
        this.attr("property").char();
        this.attr("content").char();
    }
}

class SocialSettings extends EntityModel {
    constructor() {
        super();
        this.attr("meta").models(OpenGraphTagModel);
        this.attr("title").char();
        this.attr("description").char();
        this.attr("image").model(FileModel);
    }
}

export default [
    {
        name: "forms-form-settings-social",
        type: "forms-form-settings-model",
        apply({ model }: { model: EntityModel }) {
            model
                .attr("social")
                .model(SocialSettings)
                .setDefaultValue({});
        }
    },
    {
        name: "forms-schema-settings-social",
        type: "forms-schema",
        typeDefs: `
            type OpenGraphTag {
                property: String
                content: String
            }
            
            type SocialSettings {
                title: String
                description: String
                meta: [OpenGraphTag]
                image: File
            } 
            
            extend type FormSettings {
                social: SocialSettings
            }
        `
    }
];

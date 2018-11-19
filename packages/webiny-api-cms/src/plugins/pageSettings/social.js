// @flow
import { EntityModel } from "webiny-entity";

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
    }
}

export default [
    {
        name: "cms-page-settings-social",
        type: "cms-page-settings-model",
        apply(model: EntityModel) {
            model
                .attr("social")
                .model(SocialSettings)
                .setDefaultValue({});
        }
    },
    {
        name: "cms-schema-settings-social",
        type: "cms-schema",
        typeDefs: `
            type OpenGraphTag {
                property: String
                content: String
            }
            
            type SocialSettings {
                title: String
                description: String
                meta: [OpenGraphTag]
            } 
            
            extend type PageSettings {
                social: SocialSettings
            }
        `
    }
];

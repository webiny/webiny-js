// @flow
import { EntityModel } from "webiny-entity";
import { Model } from "webiny-model";

class OpenGraphTagModel extends Model {
    constructor() {
        super();
        this.attr("property").char();
        this.attr("content").char();
    }
}

const createSocialSettings = (context: Object) =>
    class SocialSettings extends EntityModel {
        constructor() {
            super();
            this.setParentEntity(context.page);
            this.attr("meta").models(OpenGraphTagModel);
            this.attr("title").char();
            this.attr("description").char();
            this.attr("image").entity(context.files.entities.File);
        }
    };

export default [
    {
        name: "cms-page-settings-social",
        type: "cms-page-settings-model",
        apply(context: Object) {
            context.model
                .attr("social")
                .model(createSocialSettings(context))
                .setDefaultValue({});
        }
    },
    {
        name: "cms-schema-settings-social",
        type: "graphql-schema-plugin-cms",
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
            
            extend type PageBuilderPageSettings {
                social: SocialSettings
            }
        `
    }
];

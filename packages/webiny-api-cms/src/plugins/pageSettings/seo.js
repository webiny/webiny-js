// @flow
import { EntityModel } from "webiny-entity";

class MetaTagModel extends EntityModel {
    constructor() {
        super();
        this.attr("name").char();
        this.attr("content").char();
    }
}

class SeoSettings extends EntityModel {
    constructor() {
        super();
        this.attr("meta").models(MetaTagModel, false);
        this.attr("title").char();
        this.attr("description").char();
    }
}

export default [
    {
        name: "cms-page-settings-seo",
        type: "cms-page-settings-model",
        apply({ model }: { model: EntityModel }) {
            model
                .attr("seo")
                .model(SeoSettings)
                .setDefaultValue({});
        }
    },
    {
        name: "cms-schema-settings-seo",
        type: "cms-schema",
        typeDefs: `
            type MetaTag {
                name: String
                content: String
            }
            
            type SeoSettings {
                title: String
                description: String
                meta: [MetaTag]
            } 
            
            extend type PageSettings {
                seo: SeoSettings
            }
        `
    }
];

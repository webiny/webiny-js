// @flow
import { Model } from "webiny-model";

class SocialSettings extends Model {
    constructor() {
        super();
        this.attr("facebook").char();
        this.attr("twitter").char();
        this.attr("instagram").char();
    }
}

export default [
    {
        name: "cms-website-settings-social",
        type: "cms-website-settings-model",
        apply({ model }: Object) {
            model.attr("social").model(SocialSettings);
        }
    },
    {
        name: "cms-schema-website-settings-social",
        type: "cms-schema",
        typeDefs: `
            type WebsiteSocialSettings {
                facebook: String
                twitter: String
                instagram: String
            } 
            
            extend type WebsiteSettings {
                social: WebsiteSocialSettings
            }
        `
    }
];

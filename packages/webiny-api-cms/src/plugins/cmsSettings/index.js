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

class SocialMedia extends Model {
    constructor() {
        super();
        this.attr("facebook").char();
        this.attr("twitter").char();
        this.attr("instagram").char();
    }
}

class CmsSettingsGeneralModel extends Model {
    constructor() {
        super();
        this.attr("name").char();
        this.attr("favicon").model(FileModel);
        this.attr("logo").model(FileModel);
        this.attr("social").model(SocialMedia);
    }
}

export default [
    {
        name: "system-settings-cms-general",
        type: "cms-settings-model",
        model: { general: CmsSettingsGeneralModel }
    },
    {
        name: "cms-schema-system-settings-cms-general",
        type: "cms-schema",
        typeDefs: `
            type CmsSocialMedia {
                facebook: String
                twitter: String
                instagram: String
            } 
            
            type CmsGeneralSettings {
                name: String
                favicon: File
                logo: File
                social: CmsSocialMedia
            } 
            
            extend type CmsSettings {
                general: CmsGeneralSettings
            }
        `
    }
];

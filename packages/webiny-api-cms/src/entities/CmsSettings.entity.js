// @flow
import { settingsFactory } from "webiny-api/entities";
import { Model } from "webiny-model";
import FileModel from "./File.model";

class SocialMediaModel extends Model {
    constructor() {
        super();
        this.attr("facebook").char();
        this.attr("twitter").char();
        this.attr("instagram").char();
        this.attr("image").model(FileModel);
    }
}

class CmsSettingsPagesModel extends Model {
    constructor() {
        super();
        // These are actually parents, not the ID of the actual page.
        this.attr("home").char();
        this.attr("notFound").char();
        this.attr("error").char();
    }
}

class CmsSettingsModel extends Model {
    constructor() {
        super();
        this.attr("pages").model(CmsSettingsPagesModel);
        this.attr("name").char();
        this.attr("domain").char();
        this.attr("favicon").model(FileModel);
        this.attr("logo").model(FileModel);
        this.attr("social").model(SocialMediaModel);
    }
}

export const cmsSettingsFactory = (...args: Array<*>) => {
    return class CmsSettings extends settingsFactory(...args) {
        static key = "cms";
        static classId = "CmsSettings";
        static collectionName = "Settings";

        data: Object;
        load: Function;

        constructor() {
            super();
            this.attr("data").model(CmsSettingsModel);
        }
    };
};

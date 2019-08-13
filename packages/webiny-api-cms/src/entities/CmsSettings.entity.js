// @flow
import { settingsFactory } from "webiny-api/entities";
import { EntityModel } from "webiny-entity";
import { Model } from "webiny-model";

const createSocialMediaModel = context =>
    class SocialMediaModel extends EntityModel {
        constructor() {
            super();
            this.setParentEntity(context.settings);
            this.attr("facebook").char();
            this.attr("twitter").char();
            this.attr("instagram").char();
            this.attr("image").entity(context.getEntity("File"));
        }
    };

class CmsSettingsPagesModel extends Model {
    constructor() {
        super();
        // These are actually parents, not the ID of the actual page.
        this.attr("home").char();
        this.attr("notFound").char();
        this.attr("error").char();
    }
}

const createCmsSettingsModel = context => {
    return class CmsSettingsModel extends EntityModel {
        constructor() {
            super();
            this.setParentEntity(context.settings);
            this.attr("pages").model(CmsSettingsPagesModel);
            this.attr("name").char();
            this.attr("domain").char();
            this.attr("favicon").entity(context.getEntity("File"));
            this.attr("logo").entity(context.getEntity("File"));
            this.attr("social").model(createSocialMediaModel(context));
        }
    };
};

export const cmsSettingsFactory = (context: Object) => {
    return class CmsSettings extends settingsFactory(context) {
        static key = "cms";
        static classId = "CmsSettings";
        static collectionName = "Settings";

        data: Object;
        load: Function;

        constructor() {
            super();
            this.attr("data").model(createCmsSettingsModel({ ...context, settings: this }));
        }
    };
};

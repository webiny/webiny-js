// @flow
import { settingsFactory } from "@webiny/api/entities";
import { EntityModel } from "@webiny/entity";
import { Model } from "@webiny/model";

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

class PbSettingsPagesModel extends Model {
    constructor() {
        super();
        // These are actually parents, not the ID of the actual page.
        this.attr("home").char();
        this.attr("notFound").char();
        this.attr("error").char();
    }
}

const createPbSettingsModel = context => {
    return class PbSettingsModel extends EntityModel {
        constructor() {
            super();
            this.setParentEntity(context.settings);
            this.attr("pages").model(PbSettingsPagesModel);
            this.attr("name").char();
            this.attr("domain").char();
            this.attr("favicon").entity(context.getEntity("File"));
            this.attr("logo").entity(context.getEntity("File"));
            this.attr("social").model(createSocialMediaModel(context));
        }
    };
};

export const pageBuilderSettingsFactory = (context: Object) => {
    return class PbSettings extends settingsFactory(context) {
        static key = "cms";
        static classId = "PbSettings";
        static collectionName = "Settings";

        data: Object;
        load: Function;

        constructor() {
            super();
            this.attr("data").model(createPbSettingsModel({ ...context, settings: this }));
        }
    };
};

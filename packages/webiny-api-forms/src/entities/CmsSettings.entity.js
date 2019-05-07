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

class FormsSettingsFormsModel extends Model {
    constructor() {
        super();
        // These are actually parents, not the ID of the actual form.
        this.attr("home").char();
        this.attr("notFound").char();
        this.attr("error").char();
    }
}

const formsSettingsModelFactory = () => {
    return class FormsSettingsModel extends Model {
        constructor() {
            super();
            this.attr("forms").model(FormsSettingsFormsModel);
            this.attr("name").char();
            this.attr("domain").char();
            this.attr("favicon").model(FileModel);
            this.attr("logo").model(FileModel);
            this.attr("social").model(SocialMediaModel);
        }
    };
};

export const formsSettingsFactory = (...args: Array<*>) => {
    return class FormsSettings extends settingsFactory(...args) {
        static key = "forms";

        data: Object;
        load: Function;

        constructor() {
            super();
            this.attr("data").model(formsSettingsModelFactory());
        }
    };
};

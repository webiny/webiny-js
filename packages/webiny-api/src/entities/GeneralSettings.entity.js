// @flow
import { Entity } from "webiny-entity";
import { Model } from "webiny-model";
import { settingsFactory } from "./Settings.entity";
import FileModel from "./File.model";

export interface IGeneralSettings extends Entity {
    data: Object;
    load: Function;
}

class SocialMedia extends Model {
    constructor() {
        super();
        this.attr("facebook").char();
        this.attr("twitter").char();
        this.attr("instagram").char();
    }
}

class GeneralSettingsModel extends Model {
    constructor() {
        super();
        this.attr("name").char();
        this.attr("favicon").model(FileModel);
        this.attr("logo").model(FileModel);
        this.attr("social").model(SocialMedia);
    }
}

export function generalSettingsFactory(...args: Array<any>): Class<IGeneralSettings> {
    class GeneralSettings extends settingsFactory(...args) {
        static key = "general";

        data: Object;
        load: Function;

        constructor() {
            super();
            this.attr("data").model(GeneralSettingsModel);
        }
    }

    return GeneralSettings;
}

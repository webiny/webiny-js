// @flow
import { Entity } from "./Entity";

class Settings extends Entity {
    key: string;
    static key: string;
    constructor() {
        super();
        this.attr("key")
            .char()
            .setValidators("required");

        this.attr("data").object();
    }

    static load() {
        return this.findOne({ query: { key: this.key } });
    }
}

Settings.classId = "Settings";
Settings.storageClassId = "Settings";

export default Settings;

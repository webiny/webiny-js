// @flow
import Entity from "./entity";

class Settings extends Entity {
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
Settings.tableName = "Settings";

export default Settings;

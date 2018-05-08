// @flow
import Entity from "./entity";

class Settings extends Entity {
    constructor() {
        super();
        this.attr("key")
            .char()
            .setValidators("required");

        this.setDataAttribute();
    }

    static load() {
        return Settings.findOne({ query: { key: this.key } });
    }

    setDataAttribute() {
        this.attr("data").object();
    }
}

Settings.classId = "Settings";
Settings.tableName = "Settings";

export default Settings;

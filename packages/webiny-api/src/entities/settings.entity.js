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
}

Settings.classId = "Settings";
Settings.tableName = "Settings";

export default Settings;

import { Entity } from "webiny-api";

class Group extends Entity {
    constructor() {
        super();
        this.attr("name")
            .char()
            .setValidators("required");
        this.attr("slug")
            .char()
            .setValidators("required");
        this.attr("description")
            .char()
            .setValidators("required");
    }
}

Group.classId = "SecurityGroup";
Group.tableName = "Security_Groups";

export default Group;

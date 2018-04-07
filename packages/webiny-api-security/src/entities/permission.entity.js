import { Entity } from "webiny-api";
import { Model } from "webiny-model";
import Role from "./role.entity";
import Role2Permission from "./role2Permission.entity";
import nameSlugDesc from "./helpers/nameSlugDesc";

class Permission extends Entity {
    constructor() {
        super();
        nameSlugDesc(this);
        this.attr("rules").models(RuleModel);
        this.attr("roles")
            .entities(Role)
            .setUsing(Role2Permission);
    }
}

Permission.classId = "SecurityPermission";
Permission.tableName = "Security_Permissions";

export default Permission;

// Local helper classes

class RuleMethodModel extends Model {
    constructor() {
        super();
        this.attr("method")
            .char()
            .setValidators("required");
    }
}

RuleMethodModel.classId = "SecurityRuleMethodModel";

export class RuleModel extends Model {
    constructor() {
        super();
        this.attr("classId")
            .char()
            .setValidators("required");
        this.attr("methods").models(RuleMethodModel);
    }
}

RuleModel.classId = "SecurityRuleModel";

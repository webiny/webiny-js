import { Entity } from "webiny-entity";
import { IdentityAttribute } from "./../../src/attributes/identityAttribute";

export class User extends Entity {
    constructor() {
        super();
        this.attr("firstName").char();
        this.attr("lastName").char();
    }
}

User.classId = "User";

export class Company extends Entity {
    constructor() {
        super();
        this.attr("name").char();
    }
}

Company.classId = "Company";

export class Issue extends Entity {
    constructor() {
        super();
        this.attr("title").char();
        this.attr("assignedTo").custom(IdentityAttribute);
    }
}

Issue.classId = "Issue";

import { EntityAttribute, Entity } from "webiny-entity";
import { AttributesContainer } from "webiny-model";
import type { EntityAttributeOptions } from "../../types";

class User extends Entity {
    constructor() {
        super();
        this.attr("firstName").char();
        this.attr("lastName").char();
    }
}

User.classId = "User";

class Company extends Entity {
    constructor() {
        super();
        this.attr("name").char();
    }
}

Company.classId = "Company";

class IdentityAttribute extends EntityAttribute {
    constructor(
        name: string,
        attributesContainer: AttributesContainer,
        options: EntityAttributeOptions
    ) {
        super(name, attributesContainer, [User, Company], options);
    }
}

class Issue extends Entity {
    constructor() {
        super();
        this.attr("title").char();
        this.attr("assignedTo").custom(IdentityAttribute, {
            classIdAttribute: "assignedToClassId"
        });
        this.attr("assignedToClassId").char();
    }
}

Issue.classId = "Issue";

export { User, Company, Issue };

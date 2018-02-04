import { ModelAttribute, Entity, EntityModel } from "webiny-entity";
import { AttributesContainer } from "../../../webiny-model/src";

export class User extends Entity {
    constructor() {
        super();
        this.attr("firstName").char();
        this.attr("lastName").char();
    }
}

export class Company extends Entity {
    constructor() {
        super();
        this.attr("name").char();
    }
}

export class IdentityModel extends EntityModel {
    constructor(params) {
        super(params);
        this.attr("classId").char();
        this.attr("identity").entity(() => {
            if (this.classId === "Company") {
                return Company;
            }
            return User;
        });
    }
}

export class IdentityAttribute extends ModelAttribute {
    constructor(name: string, attributesContainer: AttributesContainer) {
        super(name, attributesContainer);
        this.modelClass = IdentityModel;
    }

    setValue(value) {
        const modelInstance = this.getModelInstance();
        if (value instanceof Entity) {
            modelInstance.populate({
                classId: value.classId,
                identity: value
            });
            return this.value.setCurrent(modelInstance);
        }

        modelInstance.populate(value);
        this.value.setCurrent(modelInstance);
    }

    getValue() {
        return super.getValue().identity;
    }

    /**
     * Returns storage value (entity ID or null).
     * @returns {Promise<*>}
     */
    async getStorageValue() {
        const value = this.value.getCurrent();
        if (!value) {
            return null;
        }

        return value.toStorage();
    }
}

export class Issue extends Entity {
    constructor() {
        super();
        this.attr("title").char();
        this.attr("assignedTo").custom(IdentityAttribute);
    }
}

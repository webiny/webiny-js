import { ModelAttribute } from "webiny-model";
import { Entity, EntityModel } from "webiny-entity";
import { assert } from "chai";
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
        if (value instanceof Entity) {
            const parentEntity = this.getParentModel().getParentEntity();
            return this.value.setCurrent(
                new this.modelClass({ parentEntity }).populate({
                    classId: value.classId,
                    identity: value
                })
            );
        }

        if (typeof value === "object") {
            const parentEntity = this.getParentModel().getParentEntity();
            return this.value.setCurrent(new this.modelClass({ parentEntity }).populate(value));
        }

        super.setValue(value);
    }

    setStorageValue(value: mixed): this {
        if (value) {
            // We don't want to mark value as dirty.
            const parentEntity = this.getParentModel().getParentEntity();
            const newValue = new this.modelClass({ parentEntity });
            newValue.populateFromStorage(value);
            this.value.setCurrent(newValue, { skipMarkAsSet: true, skipDifferenceCheck: true });
        }
        return this;
    }

    getValue() {
        return super.getValue().identity;
    }
}

export class Issue extends Entity {
    constructor() {
        super();
        this.attr("title").char();
        this.attr("assignedTo").custom(IdentityAttribute);
    }
}

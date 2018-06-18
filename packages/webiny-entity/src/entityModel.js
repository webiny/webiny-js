// @flow
import { Model, DefaultAttributesContainer } from "webiny-model";
import EntityAttributesContainer from "./entityAttributesContainer";
import type Entity from "./entity";

class EntityModel extends Model {
    parentEntity: Entity;
    attributesContainer: DefaultAttributesContainer | EntityAttributesContainer;
    constructor(params: ?Object) {
        super();
        if (params && typeof params === "object") {
            this.setParentEntity(params.parentEntity);
        }
    }

    setParentEntity(parentEntity: Entity): this {
        this.parentEntity = parentEntity;
        return this;
    }

    getParentEntity(): ?Entity {
        return this.parentEntity;
    }

    createAttributesContainer(): EntityAttributesContainer {
        return new EntityAttributesContainer(this);
    }
}

export default EntityModel;

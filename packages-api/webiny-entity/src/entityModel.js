// @flow
import { Model } from "webiny-model";
import EntityAttributesContainer from "./entityAttributesContainer";

class EntityModel extends Model {
    constructor() {
        super();
        this.parentEntity = null;
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

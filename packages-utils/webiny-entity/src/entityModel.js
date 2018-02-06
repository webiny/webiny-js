// @flow
import { Model } from "webiny-model";
import EntityAttributesContainer from "./entityAttributesContainer";
import type Entity from "./entity";

class EntityModel extends Model {
    constructor(params: ?(Function | Object)) {
        super(params);
        if (params && typeof params === "object") {
            if (params.parentEntity) {
                this.setParentEntity(params.parentEntity);
            }
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

// @flow
import { Model } from "@webiny/model";
import EntityAttributesContainer from "./entityAttributesContainer";
import type Entity from "./entity";

class EntityModel extends Model {
    parentEntity: $Subtype<Entity>;
    constructor(params: ?Object) {
        super();
        if (params && typeof params === "object") {
            this.setParentEntity(params.parentEntity);
        }
    }

    setParentEntity(parentEntity: $Subtype<Entity>): this {
        this.parentEntity = parentEntity;
        return this;
    }

    getParentEntity(): $Subtype<Entity> {
        return this.parentEntity;
    }

    createAttributesContainer(): EntityAttributesContainer {
        return new EntityAttributesContainer(this);
    }
}

export default EntityModel;

// @flow
import { ModelAttribute, Entity } from "webiny-entity";
import { AttributesContainer } from "webiny-model";
import IdentityModel from "./identityAttribute/identityModel";

export class IdentityAttribute extends ModelAttribute {
    constructor(name: string, attributesContainer: AttributesContainer) {
        super(name, attributesContainer);
        this.modelClass = IdentityModel;
    }

    setValue(value: mixed) {
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

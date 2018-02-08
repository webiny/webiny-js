// @flow
import { ModelAttribute, Entity } from "webiny-entity";
import { AttributesContainer } from "webiny-model";
import identityModelFactory from "./identityAttribute/identityModel";
import { Model } from "webiny-model";
import type { IAuthentication } from "../../types";

export default (authentication: IAuthentication) => {
    const IdentityModel = identityModelFactory(authentication);

    return class IdentityAttribute extends ModelAttribute {
        constructor(name: string, attributesContainer: AttributesContainer) {
            super(name, attributesContainer, IdentityModel);
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
            const value = super.getValue();
            if (value instanceof Model) {
                return value.identity;
            }
            return value;
        }

        async getValidationValue() {
            return ModelAttribute.prototype.getValue.call(this);
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

            const storage = await value.toStorage();
            return storage.classId + ":" + storage.identity;
        }

        setStorageValue(value: mixed): this {
            if (typeof value === "string") {
                // We don't want to mark value as dirty.
                const [classId, identity] = value.split(":");
                const newValue = this.getModelInstance().populateFromStorage({ classId, identity });
                this.value.setCurrent(newValue, { skipDifferenceCheck: true });
            }
            return this;
        }
    };
};

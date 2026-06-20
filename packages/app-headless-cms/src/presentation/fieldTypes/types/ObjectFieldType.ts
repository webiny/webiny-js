import { CmsFieldType } from "../abstractions.js";

class ObjectFieldTypeImpl implements CmsFieldType.Interface {
    type = "object";
    label = "Object";
    description = "Store nested data structures.";
    icon = "fas/ballot";
    allowList = true;
    listLabel = "Use as a repeatable object";
    allowPredefinedValues = false;

    createField() {
        return {
            type: this.type,
            validation: [],
            renderer: { name: "" },
            settings: { fields: [], layout: [] }
        };
    }
}

export const ObjectFieldType = CmsFieldType.createImplementation({
    implementation: ObjectFieldTypeImpl,
    dependencies: []
});

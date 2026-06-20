import { CmsFieldType } from "../abstractions.js";

class BooleanFieldTypeImpl implements CmsFieldType.Interface {
    type = "boolean";
    label = "Boolean";
    description = 'Store boolean ("yes" or "no") values.';
    icon = "fas/toggle-on";
    allowList = false;
    listLabel = "Use as a list of booleans";
    allowPredefinedValues = false;

    createField() {
        return {
            type: this.type,
            validation: [],
            renderer: { name: "" },
            settings: { defaultValue: false }
        };
    }
}

export const BooleanFieldType = CmsFieldType.createImplementation({
    implementation: BooleanFieldTypeImpl,
    dependencies: []
});

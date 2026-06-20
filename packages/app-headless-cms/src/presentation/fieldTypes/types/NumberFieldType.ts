import { CmsFieldType } from "../abstractions.js";

class NumberFieldTypeImpl implements CmsFieldType.Interface {
    type = "number";
    label = "Number";
    description = "Store numbers.";
    icon = "fas/looks-3";
    allowList = true;
    listLabel = "Use as a list of numbers";
    allowPredefinedValues = true;
    validators = ["required", "gte", "lte"];

    createField() {
        return {
            type: this.type,
            validation: [],
            renderer: { name: "" }
        };
    }
}

export const NumberFieldType = CmsFieldType.createImplementation({
    implementation: NumberFieldTypeImpl,
    dependencies: []
});

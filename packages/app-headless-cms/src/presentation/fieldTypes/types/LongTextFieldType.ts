import { CmsFieldType } from "../abstractions.js";

class LongTextFieldTypeImpl implements CmsFieldType.Interface {
    type = "long-text";
    label = "Long text";
    description = "Long comments, notes, multi line values.";
    icon = "fas/notes";
    allowList = true;
    listLabel = "Use as a list of long texts";
    allowPredefinedValues = false;
    validators = ["required", "minLength", "maxLength", "pattern"];

    createField() {
        return {
            type: this.type,
            validation: [],
            renderer: { name: "" }
        };
    }
}

export const LongTextFieldType = CmsFieldType.createImplementation({
    implementation: LongTextFieldTypeImpl,
    dependencies: []
});

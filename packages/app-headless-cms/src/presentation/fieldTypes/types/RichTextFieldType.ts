import { CmsFieldType } from "../abstractions.js";

class RichTextFieldTypeImpl implements CmsFieldType.Interface {
    type = "rich-text";
    label = "Rich text";
    description = "Text formatting with references and media.";
    icon = "fas/text-snippet";
    allowList = true;
    listLabel = "Use as a list of rich texts";
    allowPredefinedValues = false;

    createField() {
        return {
            type: this.type,
            validation: [],
            renderer: { name: "" }
        };
    }
}

export const RichTextFieldType = CmsFieldType.createImplementation({
    implementation: RichTextFieldTypeImpl,
    dependencies: []
});

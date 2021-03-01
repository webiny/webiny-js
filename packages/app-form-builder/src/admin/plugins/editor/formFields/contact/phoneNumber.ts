import textFieldPlugin from "./../text";
import { FbBuilderFieldPlugin } from "../../../../../types";

const plugin: FbBuilderFieldPlugin = {
    type: "form-editor-field-type",
    name: "form-editor-field-type-phone-number",
    field: {
        ...textFieldPlugin.field,
        unique: true,
        group: "form-editor-field-group-contact",
        name: "phoneNumber",
        label: "Phone number",
        createField(props) {
            return {
                ...textFieldPlugin.field.createField(props),
                name: this.name,
                fieldId: "phoneNumber",
                label: "Phone number"
            };
        }
    }
};

export default plugin;

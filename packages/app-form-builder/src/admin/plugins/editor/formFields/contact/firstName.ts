import textFieldPlugin from "./../text";
import { FbBuilderFieldPlugin } from "../../../../../types";

const plugin: FbBuilderFieldPlugin = {
    type: "form-editor-field-type",
    name: "form-editor-field-type-first-name",
    field: {
        ...textFieldPlugin.field,
        unique: true,
        group: "form-editor-field-group-contact",
        name: "firstName",
        label: "First name",
        createField(props) {
            return {
                ...textFieldPlugin.field.createField(props),
                name: this.name,
                fieldId: "firstName",
                label: "First name"
            };
        }
    }
};

export default plugin;

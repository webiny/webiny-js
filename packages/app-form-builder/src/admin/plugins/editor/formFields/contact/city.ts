import textFieldPlugin from "./../text";
import { FbBuilderFieldPlugin } from "../../../../../types";

const plugin: FbBuilderFieldPlugin = {
    type: "form-editor-field-type",
    name: "form-editor-field-type-city",
    field: {
        ...textFieldPlugin.field,
        unique: true,
        group: "form-editor-field-group-contact",
        name: "city",
        label: "City",
        createField(props) {
            return {
                ...textFieldPlugin.field.createField(props),
                name: this.name,
                fieldId: "city",
                label: "City"
            };
        }
    }
};

export default plugin;

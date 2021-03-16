import textFieldPlugin from "./../text";
import { FbBuilderFieldPlugin } from "../../../../../types";

const plugin: FbBuilderFieldPlugin = {
    type: "form-editor-field-type",
    name: "form-editor-field-type-country",
    field: {
        ...textFieldPlugin.field,
        unique: true,
        group: "form-editor-field-group-contact",
        name: "country",
        label: "Country",
        createField(props) {
            return {
                ...textFieldPlugin.field.createField(props),
                name: this.name,
                fieldId: "country",
                label: "Country"
            };
        }
    }
};

export default plugin;

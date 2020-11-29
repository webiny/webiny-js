import textFieldPlugin from "./../text";
import { FbBuilderFieldPlugin } from "@webiny/app-form-builder/types";

const plugin: FbBuilderFieldPlugin = {
    type: "form-editor-field-type",
    name: "form-editor-field-type-job-title",
    field: {
        ...textFieldPlugin.field,
        unique: true,
        group: "form-editor-field-group-contact",
        name: "jobTitle",
        label: "Job title",
        createField(props) {
            return {
                ...textFieldPlugin.field.createField(props),
                name: this.name,
                fieldId: "jobTitle",
                label: "Job title"
            };
        }
    }
};

export default plugin;

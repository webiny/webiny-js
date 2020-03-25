import textFieldPlugin from "./../text";
import {FbBuilderFieldPlugin} from "@webiny/app-headless-cms/types";

const plugin: FbBuilderFieldPlugin = {
    type: "content-model-editor-field-type",
    name: "content-model-editor-field-type-job-title",
    field: {
        ...textFieldPlugin.field,
        unique: true,
        group: "content-model-editor-field-group-contact",
        name: "jobTitle",
        label: "Job title",
        createField(props) {
            const { i18n } = props;
            return {
                ...textFieldPlugin.field.createField(props),
                name: this.name,
                fieldId: "jobTitle",
                label: {
                    values: [
                        {
                            locale: i18n.getDefaultLocale().id,
                            value: "Job title"
                        }
                    ]
                }
            };
        }
    }
};

export default plugin;

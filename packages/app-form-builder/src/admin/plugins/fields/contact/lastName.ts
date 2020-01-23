import textFieldPlugin from "./../text";
import { FbBuilderFieldPlugin } from "@webiny/app-form-builder/types";

const plugin: FbBuilderFieldPlugin = {
    type: "form-editor-field-type",
    name: "form-editor-field-type-last-name",
    field: {
        ...textFieldPlugin.field,
        unique: true,
        group: "form-editor-field-group-contact",
        name: "lastName",
        label: "Last name",
        createField(props) {
            const { i18n } = props;
            return {
                ...textFieldPlugin.field.createField(props),
                name: this.name,
                fieldId: "lastName",
                label: {
                    values: [
                        {
                            locale: i18n.getDefaultLocale().id,
                            value: "Last name"
                        }
                    ]
                }
            };
        }
    }
};

export default plugin;

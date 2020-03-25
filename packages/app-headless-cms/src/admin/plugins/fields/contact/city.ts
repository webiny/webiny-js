import textFieldPlugin from "./../text";
import { FbBuilderFieldPlugin } from "@webiny/app-headless-cms/types";

const plugin: FbBuilderFieldPlugin = {
    type: "content-model-editor-field-type",
    name: "content-model-editor-field-type-city",
    field: {
        ...textFieldPlugin.field,
        unique: true,
        group: "content-model-editor-field-group-contact",
        name: "city",
        label: "City",
        createField(props) {
            const { i18n } = props;
            return {
                ...textFieldPlugin.field.createField(props),
                name: this.name,
                fieldId: "city",
                label: {
                    values: [
                        {
                            locale: i18n.getDefaultLocale().id,
                            value: "City"
                        }
                    ]
                }
            };
        }
    }
};

export default plugin;

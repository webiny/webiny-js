import textFieldPlugin from "./../text";
import { FbBuilderFieldPlugin } from "@webiny/app-headless-cms/types";

const plugin: FbBuilderFieldPlugin = {
    type: "content-model-editor-field-type",
    name: "content-model-editor-field-type-first-name",
    field: {
        ...textFieldPlugin.field,
        unique: true,
        group: "content-model-editor-field-group-contact",
        name: "firstName",
        label: "First name",
        createField(props) {
            const { i18n } = props;
            return {
                ...textFieldPlugin.field.createField(props),
                name: this.name,
                fieldId: "firstName",
                label: {
                    values: [
                        {
                            locale: i18n.getDefaultLocale().id,
                            value: "First name"
                        }
                    ]
                }
            };
        }
    }
};

export default plugin;

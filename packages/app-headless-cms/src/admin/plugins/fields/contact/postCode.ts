import textFieldPlugin from "./../text";
import { FbBuilderFieldPlugin } from "@webiny/app-headless-cms/types";

const plugin: FbBuilderFieldPlugin = {
    type: "content-model-editor-field-type",
    name: "content-model-editor-field-type-post-code",
    field: {
        ...textFieldPlugin.field,
        unique: true,
        group: "content-model-editor-field-group-contact",
        name: "postCode",
        label: "Post code",
        createField(props) {
            const { i18n } = props;
            return {
                ...textFieldPlugin.field.createField(props),
                name: this.name,
                fieldId: "postCode",
                label: {
                    values: [
                        {
                            locale: i18n.getDefaultLocale().id,
                            value: "Post code"
                        }
                    ]
                }
            };
        }
    }
};

export default plugin;

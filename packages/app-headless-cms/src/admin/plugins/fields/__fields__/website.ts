import textFieldPlugin from "./../text";
import { FbBuilderFieldPlugin } from "@webiny/app-headless-cms/types";

const plugin: FbBuilderFieldPlugin = {
    type: "content-model-editor-field-type",
    name: "content-model-editor-field-type-website",
    field: {
        ...textFieldPlugin.field,
        unique: true,
        group: "content-model-editor-field-group-contact",
        name: "website",
        label: "Website",
        description: "Link to a website",
        createField(props) {
            const { i18n } = props;
            return {
                ...textFieldPlugin.field.createField(props),
                name: this.name,
                fieldId: "website",
                label: {
                    values: [
                        {
                            locale: i18n.getDefaultLocale().id,
                            value: "Website"
                        }
                    ]
                },
                validation: [
                    {
                        name: "pattern",
                        message: {
                            values: [
                                {
                                    locale: i18n.getDefaultLocale().id,
                                    value: "Please enter a valid URL."
                                }
                            ]
                        },
                        settings: {
                            preset: "url",
                            regex: null,
                            flags: null
                        }
                    }
                ]
            };
        }
    }
};

export default plugin;

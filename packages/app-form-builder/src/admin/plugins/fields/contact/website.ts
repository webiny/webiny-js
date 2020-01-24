import textFieldPlugin from "./../text";
import { FbBuilderFieldPlugin } from "@webiny/app-form-builder/types";

const plugin: FbBuilderFieldPlugin = {
    type: "form-editor-field-type",
    name: "form-editor-field-type-website",
    field: {
        ...textFieldPlugin.field,
        unique: true,
        group: "form-editor-field-group-contact",
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

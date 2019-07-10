import textFieldPlugin from "./../text";

export default {
    type: "form-editor-field-type",
    name: "form-editor-field-type-website",
    field: {
        ...textFieldPlugin.field,
        group: "form-editor-field-group-contact",
        name: "website",
        label: "Website",
        description: "Link to a website",
        // TODO: validators: ["required"],
        createField(props) {
            const { i18n } = props;
            return {
                ...textFieldPlugin.field.createField(),
                name: this.name,
                fieldId: "website",
                label: {
                    values: [
                        {
                            locale: i18n.getDefaultLocale().id,
                            value: "Website"
                        }
                    ]
                }
            };

            // TODO:
            /*validation: [
                {
                    id: "pattern",
                    regex:
                        "^(ftp|http|https):\\/\\/(\\w+:{0,1}\\w*@)?(\\S+)(:[0-9]+)?(\\/|\\/([\\w#!:.?+=&%@!\\-\\/]))?$",
                    flags: "i",
                    message: "Please enter a valid URL."
                }
            ]*/
        }
    }
};

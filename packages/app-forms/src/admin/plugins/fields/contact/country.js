import textFieldPlugin from "./../text";

export default {
    type: "form-editor-field-type",
    name: "form-editor-field-type-country",
    field: {
        ...textFieldPlugin.field,
        unique: true,
        group: "form-editor-field-group-contact",
        name: "country",
        label: "Country",
        createField(props) {
            const { i18n } = props;
            return {
                ...textFieldPlugin.field.createField(props),
                name: this.name,
                fieldId: "country",
                label: {
                    values: [
                        {
                            locale: i18n.getDefaultLocale().id,
                            value: "Country"
                        }
                    ]
                }
            };
        }
    }
};

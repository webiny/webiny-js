import textFieldPlugin from "./../text";

export default {
    type: "form-editor-field-type",
    name: "form-editor-field-type-street-address",
    field: {
        ...textFieldPlugin.field,
        unique: true,
        group: "form-editor-field-group-contact",
        name: "streetAddress",
        label: "Street address",
        createField(props) {
            const { i18n } = props;
            return {
                ...textFieldPlugin.field.createField(props),
                name: this.name,
                fieldId: "streetAddress",
                label: {
                    values: [
                        {
                            locale: i18n.getDefaultLocale().id,
                            value: "Street address"
                        }
                    ]
                }
            };
        }
    }
};

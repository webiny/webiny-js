import textFieldPlugin from "./../text";

export default {
    type: "form-editor-field-type",
    name: "form-editor-field-type-city",
    field: {
        ...textFieldPlugin.field,
        unique: true,
        group: "form-editor-field-group-contact",
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

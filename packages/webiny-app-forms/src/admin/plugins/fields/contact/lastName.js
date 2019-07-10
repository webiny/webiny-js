import textFieldPlugin from "./../text";

export default {
    type: "form-editor-field-type",
    name: "form-editor-field-type-last-name",
    field: {
        ...textFieldPlugin.field,
        group: "form-editor-field-group-contact",
        name: "lastName",
        label: "Last name",
        createField(props) {
            const { i18n } = props;
            return {
                ...textFieldPlugin.field.createField(),
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

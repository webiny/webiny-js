import textFieldPlugin from "./../text";

export default {
    type: "form-editor-field-type",
    name: "form-editor-field-type-company-name",
    field: {
        ...textFieldPlugin.field,
        unique: true,
        group: "form-editor-field-group-contact",
        name: "companyName",
        label: "Company name",
        createField(props) {
            const { i18n } = props;
            return {
                ...textFieldPlugin.field.createField(props),
                name: this.name,
                fieldId: "companyName",
                label: {
                    values: [
                        {
                            locale: i18n.getDefaultLocale().id,
                            value: "Company name"
                        }
                    ]
                }
            };
        }
    }
};

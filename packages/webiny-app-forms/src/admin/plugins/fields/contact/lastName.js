import textFieldPlugin from "./../text";

export default {
    type: "form-editor-field-type",
    name: "form-editor-field-type-last-name",
    fieldType: {
        ...textFieldPlugin.fieldType,
        group: "form-editor-field-group-contact",
        id: "lastName",
        label: "Last name",
        unique: true,
        createField(props) {
            const { i18n } = props;
            return {
                ...textFieldPlugin.fieldType.createField(),
                _id: "lastName",
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

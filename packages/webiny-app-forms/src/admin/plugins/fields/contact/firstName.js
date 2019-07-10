import textFieldPlugin from "./../text";

export default {
    type: "form-editor-field-type",
    name: "form-editor-field-type-first-name",
    fieldType: {
        ...textFieldPlugin.fieldType,
        group: "form-editor-field-group-contact",
        id: "firstName",
        label: "First name",
        unique: true,
        createField(props) {
            const { i18n } = props;
            return {
                ...textFieldPlugin.fieldType.createField(props),
                _id: "firstName",
                fieldId: "firstName",
                label: {
                    values: [
                        {
                            locale: i18n.getDefaultLocale().id,
                            value: "First name"
                        }
                    ]
                }
            };
        }
    }
};

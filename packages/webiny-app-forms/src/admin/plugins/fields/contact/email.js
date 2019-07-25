import textFieldPlugin from "./../text";

export default {
    type: "form-editor-field-type",
    name: "form-editor-field-type-email",
    field: {
        ...textFieldPlugin.field,
        unique: true,
        group: "form-editor-field-group-contact",
        name: "email",
        label: "Email   ",
        description: "Email address",
        // TODO: validators: ["required"], // Editable validators.
        createField(props) {
            const { i18n } = props;
            return {
                ...textFieldPlugin.field.createField(props),
                name: this.name,
                fieldId: "email",
                label: {
                    values: [
                        {
                            locale: i18n.getDefaultLocale().id,
                            value: "Email"
                        }
                    ]
                }
            };

            // TODO:
            /*
            validation: [
                // Hard-coded validators, cannot be edited / seen by user.
                {
                    id: "pattern",
                    regex: "^\\w[\\w.-]*@([\\w-]+\\.)+[\\w-]+$",
                    flags: "i",
                    message: "Please enter a valid email address."
                }
            ]
            */
        }
    }
};

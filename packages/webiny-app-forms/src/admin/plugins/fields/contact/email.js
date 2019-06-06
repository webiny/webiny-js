export default {
    type: "form-editor-field-type",
    name: "form-editor-field-email",
    fieldType: {
        id: "email",
        label: "Email",
        description: "Email address",
        group: "form-editor-field-group-contact",
        icon: null,
        validators: ["required"], // Editable validators.
        createField() {
            return {
                fieldId: "email",
                label: "Email",
                type: this.id,
                validation: [
                    // Hard-coded validators, cannot be edited / seen by user.
                    {
                        id: "pattern",
                        regex: "^\\w[\\w.-]*@([\\w-]+\\.)+[\\w-]+$",
                        flags: "i",
                        message: "Please enter a valid email address."
                    }
                ]
            };
        }
    }
};

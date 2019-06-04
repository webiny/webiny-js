import React from "react";

export default {
    type: "form-editor-field-type",
    name: "form-editor-field-email",
    fieldType: {
        id: "email",
        label: "Email",
        description: "Email address",
        group: "form-editor-field-group-contact",
        icon: null,
        validators: ["required"],
        createField() {
            return {
                fieldId: "email",
                label: "Email",
                type: this.id,
                validation: [
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
import React from "react";

export default {
    type: "cms-form-field-type",
    name: "cms-form-field-email",
    fieldType: {
        id: "email",
        label: "Email",
        description: "Email address",
        group: "cms-form-field-group-contact",
        icon: null,
        validators: ["required"],
        createField() {
            return {
                id: "email",
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
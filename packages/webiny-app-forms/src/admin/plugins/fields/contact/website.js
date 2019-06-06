export default {
    type: "form-editor-field-type",
    name: "form-editor-field-website",
    fieldType: {
        id: "website",
        label: "Website",
        description: "Link to a website",
        group: "form-editor-field-group-contact",
        icon: null,
        validators: ["required"],
        createField() {
            return {
                fieldId: "url",
                label: "URL",
                type: "website",
                validation: [
                    {
                        id: "pattern",
                        regex:
                            "^(ftp|http|https):\\/\\/(\\w+:{0,1}\\w*@)?(\\S+)(:[0-9]+)?(\\/|\\/([\\w#!:.?+=&%@!\\-\\/]))?$",
                        flags: "i",
                        message: "Please enter a valid URL."
                    }
                ]
            };
        }
    }
};

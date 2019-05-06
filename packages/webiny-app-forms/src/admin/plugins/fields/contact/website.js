export default {
    type: "cms-form-field-type",
    name: "cms-form-field-website",
    fieldType: {
        id: "website",
        label: "Website",
        description: "Link to a website",
        group: "cms-form-field-group-contact",
        icon: null,
        validators: ["required"],
        createField() {
            return {
                id: "url",
                label: "URL",
                type: this.id,
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

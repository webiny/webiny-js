import textFieldPlugin from "./../text";

export default {
    type: "form-editor-field-type",
    name: "form-editor-field-type-job-title",
    field: {
        ...textFieldPlugin.field,
        unique: true,
        group: "form-editor-field-group-contact",
        name: "jobTitle",
        label: "Job title",
        createField(props) {
            const { i18n } = props;
            return {
                ...textFieldPlugin.field.createField(props),
                name: this.name,
                fieldId: "jobTitle",
                label: {
                    values: [
                        {
                            locale: i18n.getDefaultLocale().id,
                            value: "Job title"
                        }
                    ]
                }
            };
        }
    }
};

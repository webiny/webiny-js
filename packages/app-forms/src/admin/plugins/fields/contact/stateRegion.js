import textFieldPlugin from "./../text";

export default {
    type: "form-editor-field-type",
    name: "form-editor-field-type-state-region",
    field: {
        ...textFieldPlugin.field,
        unique: true,
        group: "form-editor-field-group-contact",
        name: "stateRegion",
        label: "State/Region",
        createField(props) {
            const { i18n } = props;
            return {
                ...textFieldPlugin.field.createField(props),
                name: this.name,
                fieldId: "stateRegion",
                label: {
                    values: [
                        {
                            locale: i18n.getDefaultLocale().id,
                            value: "State/Region"
                        }
                    ]
                }
            };
        }
    }
};

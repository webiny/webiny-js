export default {
    type: "form-editor-field-type",
    name: "form-editor-field-type-last-name",
    fieldType: {
        id: "last-name",
        group: "form-editor-field-group-contact",
        label: "Last name",
        createField() {
            return {
                id: this.id,
                label: "Last name",
                type: "text",
                validation: []
            };
        }
    }
};
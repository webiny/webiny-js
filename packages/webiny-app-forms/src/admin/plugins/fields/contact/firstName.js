export default {
    type: "form-editor-field-type",
    name: "form-editor-field-type-first-name",
    fieldType: {
        id: "firstName",
        group: "form-editor-field-group-contact",
        label: "First name",
        createField() {
            return {
                fieldId: this.id,
                label: "First name",
                type: "text",
                validation: []
            };
        }
    }
};
export default {
    type: "cms-form-field-type",
    name: "cms-form-field-type-first-name",
    fieldType: {
        id: "first-name",
        group: "cms-form-field-group-contact",
        label: "First name",
        createField() {
            return {
                id: this.id,
                label: "First name",
                type: "text",
                validation: []
            };
        }
    }
};
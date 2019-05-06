export default {
    type: "cms-form-field-type",
    name: "cms-form-field-type-last-name",
    fieldType: {
        id: "last-name",
        group: "cms-form-field-group-contact",
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
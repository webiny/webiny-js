import React from "react";
import { ReactComponent as NumberIcon } from "./icons/round-looks_3-24px.svg";

export default {
    type: "form-editor-field-type",
    name: "form-editor-field-type-number",
    fieldType: {
        dataType: true,
        id: "number",
        label: "Number",
        description: "ID, order number, rating, quantity",
        icon: <NumberIcon />,
        validators: ["required", "gte", "lte", "in"],
        createField() {
            return {
                id: "",
                label: "",
                type: this.id,
                validation: []
            };
        }
    }
};

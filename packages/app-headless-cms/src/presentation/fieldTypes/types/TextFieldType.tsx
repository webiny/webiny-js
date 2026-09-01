import React from "react";
import { ReactComponent as TextIcon } from "@webiny/icons/text_fields.svg";
import { CmsFieldType } from "../abstractions.js";

class TextFieldTypeImpl implements CmsFieldType.Interface {
    type = "text";
    label = "Text";
    description = "Titles, names, single line values.";
    icon = <TextIcon />;
    allowList = true;
    listLabel = "Use as a list of texts";
    allowPredefinedValues = true;
    validators = ["required", "minLength", "maxLength", "pattern", "unique"];

    createField() {
        return {
            type: this.type,
            validation: [],
            renderer: { name: "" }
        };
    }
}

export const TextFieldType = CmsFieldType.createImplementation({
    implementation: TextFieldTypeImpl,
    dependencies: []
});

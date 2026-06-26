import React from "react";
import { ReactComponent as RichTextIcon } from "@webiny/icons/text_snippet.svg";
import { CmsFieldType } from "../abstractions.js";

class RichTextFieldTypeImpl implements CmsFieldType.Interface {
    type = "rich-text";
    label = "Rich text";
    description = "Text formatting with references and media.";
    icon = <RichTextIcon />;
    allowList = true;
    listLabel = "Use as a list of rich texts";
    allowPredefinedValues = false;

    createField() {
        return {
            type: this.type,
            validation: [],
            renderer: { name: "" }
        };
    }
}

export const RichTextFieldType = CmsFieldType.createImplementation({
    implementation: RichTextFieldTypeImpl,
    dependencies: []
});

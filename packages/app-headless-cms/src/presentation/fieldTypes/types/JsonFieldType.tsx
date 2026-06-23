import React from "react";
import { ReactComponent as JsonIcon } from "@webiny/icons/data_object.svg";
import { CmsFieldType } from "../abstractions.js";

class JsonFieldTypeImpl implements CmsFieldType.Interface {
    type = "json";
    label = "JSON";
    description = "Store JSON values.";
    icon = (<JsonIcon />);
    allowList = true;
    listLabel = "Use as a list of JSONs";
    allowPredefinedValues = true;
    hideInAdmin = true;

    createField() {
        return {
            type: this.type,
            validation: [],
            renderer: { name: "" },
            settings: { defaultValue: false }
        };
    }
}

export const JsonFieldType = CmsFieldType.createImplementation({
    implementation: JsonFieldTypeImpl,
    dependencies: []
});

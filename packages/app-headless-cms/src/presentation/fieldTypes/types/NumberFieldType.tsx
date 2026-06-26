import React from "react";
import { ReactComponent as NumberIcon } from "@webiny/icons/looks_3.svg";
import { CmsFieldType } from "../abstractions.js";

class NumberFieldTypeImpl implements CmsFieldType.Interface {
    type = "number";
    label = "Number";
    description = "Store numbers.";
    icon = <NumberIcon />;
    allowList = true;
    listLabel = "Use as a list of numbers";
    allowPredefinedValues = true;
    validators = ["required", "gte", "lte"];

    createField() {
        return {
            type: this.type,
            validation: [],
            renderer: { name: "" }
        };
    }
}

export const NumberFieldType = CmsFieldType.createImplementation({
    implementation: NumberFieldTypeImpl,
    dependencies: []
});

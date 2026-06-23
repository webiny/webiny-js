import React from "react";
import { ReactComponent as RefIcon } from "@webiny/icons/link.svg";
import { CmsFieldType, type ICmsFieldType } from "../abstractions.js";
import { renderInfo } from "./ref/renderInfo.js";

class RefFieldTypeImpl implements CmsFieldType.Interface {
    type = "ref";
    label = "Reference";
    description = "Reference existing content entries.";
    icon = <RefIcon />;
    allowList = true;
    listLabel = "Use as a list of references";
    allowPredefinedValues = false;
    validators = ["required"];

    renderInfo: ICmsFieldType["renderInfo"] = renderInfo;

    createField() {
        return {
            type: this.type,
            validation: [],
            renderer: { name: "" },
            settings: { models: [] }
        };
    }
}

export const RefFieldType = CmsFieldType.createImplementation({
    implementation: RefFieldTypeImpl,
    dependencies: []
});

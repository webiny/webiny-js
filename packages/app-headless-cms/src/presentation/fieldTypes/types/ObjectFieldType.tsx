import React from "react";
import { ReactComponent as ObjectIcon } from "@webiny/icons/ballot.svg";
import { CmsFieldType } from "../abstractions.js";
import type { CmsModelField } from "~/types.js";
import { ObjectFields } from "~/admin/plugins/fields/object/ObjectFields.js";

class ObjectFieldTypeImpl implements CmsFieldType.Interface {
    type = "object";
    label = "Object";
    description = "Store nested data structures.";
    icon = (<ObjectIcon />);
    allowList = true;
    listLabel = "Use as a repeatable object";
    allowPredefinedValues = false;

    renderEditor({ field }: { field: CmsModelField }) {
        return <ObjectFields field={field} />;
    }

    createField() {
        return {
            type: this.type,
            validation: [],
            renderer: { name: "" },
            settings: { fields: [], layout: [] }
        };
    }
}

export const ObjectFieldType = CmsFieldType.createImplementation({
    implementation: ObjectFieldTypeImpl,
    dependencies: []
});

import React from "react";
import { ReactComponent as DateTimeIcon } from "~/admin/plugins/fields/icons/schedule-black-24px.svg";
import { CmsFieldType } from "../abstractions.js";

class DateTimeFieldTypeImpl implements CmsFieldType.Interface {
    type = "datetime";
    label = "Date/Time";
    description = "Store date and time.";
    icon = <DateTimeIcon />;
    allowList = true;
    listLabel = "Use as a list of dates";
    allowPredefinedValues = false;
    validators = ["required", "dateGte", "dateLte"];

    createField() {
        return {
            type: this.type,
            validation: [],
            renderer: { name: "" },
            settings: { type: "date" }
        };
    }
}

export const DateTimeFieldType = CmsFieldType.createImplementation({
    implementation: DateTimeFieldTypeImpl,
    dependencies: []
});

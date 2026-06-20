import { CmsFieldType } from "../abstractions.js";

class DateTimeFieldTypeImpl implements CmsFieldType.Interface {
    type = "datetime";
    label = "Date/Time";
    description = "Store date and time.";
    icon = "fas/schedule";
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

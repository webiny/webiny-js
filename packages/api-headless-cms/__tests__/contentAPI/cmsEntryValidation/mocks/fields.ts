import { createBooleanField } from "./field.boolean";
import { createDateTimeField } from "./field.dateTime";
import { createFileField } from "./field.file";
import { createLongTextField } from "./field.longText";
import { createReferenceField } from "./field.reference";
import { createNumberField } from "./field.number";
import { createRichTextField } from "./field.richText";
import { createTextField } from "./field.text";
import { createTimeField } from "./field.time";
import { createDynamicZoneField } from "./field.dynamicZone";
import { createObjectField } from "./field.object";
import { createDateField } from "./field.date";

export * from "./field.base";
export * from "./field.boolean";
export * from "./field.date";
export * from "./field.dateTime";
export * from "./field.dynamicZone";
export * from "./field.file";
export * from "./field.longText";
export * from "./field.number";
export * from "./field.object";
export * from "./field.reference";
export * from "./field.richText";
export * from "./field.time";
export * from "./field.text";

export const createFields = () => {
    const multipleValuesParams = {
        multipleValues: true
    };
    return [
        createTextField(),
        createLongTextField(),
        createRichTextField(),
        createNumberField(),
        createBooleanField(),
        createDateField(),
        createTimeField(),
        createDateTimeField(),
        createFileField(),
        createReferenceField(),
        createObjectField(),
        createDynamicZoneField(),
        // multiple values
        createTextField(multipleValuesParams),
        createLongTextField(multipleValuesParams),
        createRichTextField(multipleValuesParams),
        createNumberField(multipleValuesParams),
        createBooleanField(multipleValuesParams),
        createDateField(multipleValuesParams),
        createTimeField(multipleValuesParams),
        createDateTimeField(multipleValuesParams),
        createFileField(multipleValuesParams),
        createReferenceField(multipleValuesParams)
    ];
};

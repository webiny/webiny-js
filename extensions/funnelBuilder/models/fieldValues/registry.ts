import { StringFieldValue } from "./StringFieldValue";
import { NumberFieldValue } from "./NumberFieldValue";
import { BooleanFieldValue } from "./BooleanFieldValue";
import { StringArrayFieldValue } from "./StringArrayFieldValue";
import { NumberArrayFieldValue } from "./NumberArrayFieldValue";
import { BooleanArrayFieldValue } from "./BooleanArrayFieldValue";

export const registry = [
    StringFieldValue,
    StringArrayFieldValue,
    NumberFieldValue,
    NumberArrayFieldValue,
    BooleanFieldValue,
    BooleanArrayFieldValue
];

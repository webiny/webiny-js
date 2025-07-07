import {
    TextInput,
    LongTextInput,
    NumberInput,
    BooleanInput,
    ColorInput,
    FileInput,
    LexicalInput,
    SelectInput,
    RadioInput,
    ObjectInput,
    DateTimeInput,
    ComponentInput,
    TagsInput,
    SlotInput
} from "./types";
import { functionConverter } from "~/sdk/FunctionConverter";

type OmitType<T> = Omit<T, "type">;

// Text
export function createTextInput(input: OmitType<TextInput>) {
    return createInput({
        type: "text",
        renderer: "Webiny/Input",
        ...input
    }) as TextInput;
}

// Long Text
export function createLongTextInput(input: OmitType<LongTextInput>) {
    return createInput({
        type: "longText",
        renderer: "Webiny/Textarea",
        ...input
    });
}

// Number
export function createNumberInput(input: OmitType<NumberInput>) {
    return createInput({
        type: "number",
        renderer: "Webiny/Number",
        ...input
    }) as NumberInput;
}

// Boolean
export function createBooleanInput(input: OmitType<BooleanInput>) {
    return createInput({
        type: "boolean",
        renderer: "Webiny/Switch",
        ...input
    }) as BooleanInput;
}

// Color
export function createColorInput(input: OmitType<ColorInput>) {
    return createInput({
        type: "color",
        renderer: "Webiny/ColorPicker",
        ...input
    }) as ColorInput;
}

// File
export function createFileInput(input: OmitType<FileInput>) {
    return createInput({
        type: "file",
        renderer: "Webiny/FileManager",
        ...input
    }) as FileInput;
}

// Date
export function createDateInput(input: OmitType<DateTimeInput>) {
    return createInput({
        type: "datetime",
        renderer: "Webiny/DateTime",
        ...input
    }) as DateTimeInput;
}

// Rich Text
export function createLexicalInput(input: OmitType<LexicalInput>) {
    return createInput({
        type: "lexical",
        renderer: "Webiny/Lexical",
        ...input
    }) as LexicalInput;
}

// Select
export function createSelectInput(input: OmitType<SelectInput>) {
    return createInput({
        type: "select",
        renderer: "Webiny/Select",
        ...input
    }) as SelectInput;
}

// Radio
export function createRadioInput(input: OmitType<RadioInput>) {
    return createInput({
        type: "radio",
        renderer: "Webiny/RadioGroup",
        ...input
    }) as RadioInput;
}

// Object
export function createObjectInput(input: OmitType<ObjectInput>) {
    return createInput({
        type: "object",
        renderer: "Webiny/Object",
        ...input
    }) as ObjectInput;
}

// Tags
export function createTagsInput(input: OmitType<TagsInput>) {
    return createInput({
        type: "text",
        list: true,
        renderer: "Webiny/Tags",
        ...input
    }) as TagsInput;
}

export function createSlotInput(input: OmitType<SlotInput>) {
    return createInput({
        type: "slot",
        list: true,
        renderer: "Webiny/Slot",
        ...input
    }) as SlotInput;
}

// Implementation
export function createInput(input: ComponentInput): ComponentInput {
    if (input.onChange) {
        // @ts-expect-error We don't use this function on the frontend, so this is ok.
        input.onChange = functionConverter.serialize(input.onChange!);
    }
    return input;
}

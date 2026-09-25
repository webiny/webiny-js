import type {
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
    SlotInput,
    ContentEntryInput
} from "./types.js";
import { functionConverter } from "~/FunctionConverter.js";

export type InputFactory<Name extends string> =
    | ReturnType<typeof createTextInput<Name>>
    | ReturnType<typeof createLongTextInput<Name>>
    | ReturnType<typeof createNumberInput<Name>>
    | ReturnType<typeof createBooleanInput<Name>>
    | ReturnType<typeof createColorInput<Name>>
    | ReturnType<typeof createFileInput<Name>>
    | ReturnType<typeof createDateInput<Name>>
    | ReturnType<typeof createLexicalInput<Name>>
    | ReturnType<typeof createSelectInput<Name>>
    | ReturnType<typeof createRadioInput<Name>>
    | ReturnType<typeof createObjectInput<Name>>
    | ReturnType<typeof createTagsInput<Name>>
    | ReturnType<typeof createSlotInput<Name>>
    | ReturnType<typeof createContentEntryInput<Name>>;

/**
 * TypeScript Overload Resolution and Input Factory Design
 *
 * Each input factory (e.g., createTextInput) is defined with two TypeScript overload signatures:
 *   1. One overload requires a `name` property in the input (used for array-based APIs, where inference is needed).
 *   2. The other overload omits the `name` property (used for object-based APIs, where the key provides the name).
 *
 * TypeScript resolves overloads by scanning from top to bottom and picking the first matching signature.
 * The implementation signature uses `any` for the argument, and the return type is unified to match all overloads.
 *
 * In array mode, the `name` must be explicitly provided in the input object, so inference for `TName` works.
 * In object mode, the input does not require a `name` property; instead, the key in the object (e.g., `{ foo: createTextInput({ ... }) }`)
 * provides the name via contextual typing from the consuming function (such as `createComponent`). TypeScript uses this context
 * to resolve the correct type for `TName` even when `name` is omitted from the input.
 *
 * This pattern ensures that all returned input objects are typed as `{ name: TName }`, whether `name` is provided explicitly or inferred,
 * so consumers of these factories do not need to worry about the presence of the `name` property in the result.
 */
// Text
export function createTextInput<TName extends string>(
    input: { name: TName } & Omit<TextInput, "type" | "name">
): TextInput & { name: TName };
export function createTextInput<TName extends string>(
    input: Omit<TextInput, "type" | "name">
): TextInput & { name: TName };
export function createTextInput<TName extends string>(input: any): TextInput & { name: TName } {
    return createInput({
        type: "text",
        renderer: "Webiny/Input",
        ...input
    }) as TextInput & { name: TName };
}

// Long Text
export function createLongTextInput<TName extends string>(
    input: { name: TName } & Omit<LongTextInput, "type" | "name">
): LongTextInput & { name: TName };
export function createLongTextInput<TName extends string>(
    input: Omit<LongTextInput, "type" | "name">
): LongTextInput & { name: TName };
export function createLongTextInput<TName extends string>(
    input: any
): LongTextInput & { name: TName } {
    return createInput({
        type: "longText",
        renderer: "Webiny/Textarea",
        ...input
    }) as LongTextInput & { name: TName };
}

// Number
export function createNumberInput<TName extends string>(
    input: { name: TName } & Omit<NumberInput, "type" | "name">
): NumberInput & { name: TName };
export function createNumberInput<TName extends string>(
    input: Omit<NumberInput, "type" | "name">
): NumberInput & { name: TName };
export function createNumberInput<TName extends string>(input: any): NumberInput & { name: TName } {
    return createInput({
        type: "number",
        renderer: "Webiny/Number",
        ...input
    }) as NumberInput & { name: TName };
}

// Boolean
export function createBooleanInput<TName extends string>(
    input: { name: TName } & Omit<BooleanInput, "type" | "name">
): BooleanInput & { name: TName };
export function createBooleanInput<TName extends string>(
    input: Omit<BooleanInput, "type" | "name">
): BooleanInput & { name: TName };
export function createBooleanInput<TName extends string>(
    input: any
): BooleanInput & { name: TName } {
    return createInput({
        type: "boolean",
        renderer: "Webiny/Switch",
        ...input
    }) as BooleanInput & { name: TName };
}

// Color
export function createColorInput<TName extends string>(
    input: { name: TName } & Omit<ColorInput, "type" | "name">
): ColorInput & { name: TName };
export function createColorInput<TName extends string>(
    input: Omit<ColorInput, "type" | "name">
): ColorInput & { name: TName };
export function createColorInput<TName extends string>(input: any): ColorInput & { name: TName } {
    return createInput({
        type: "color",
        renderer: "Webiny/ColorPicker",
        ...input
    }) as ColorInput & { name: TName };
}

// File
export function createFileInput<TName extends string>(
    input: { name: TName } & Omit<FileInput, "type" | "name">
): FileInput & { name: TName };
export function createFileInput<TName extends string>(
    input: Omit<FileInput, "type" | "name">
): FileInput & { name: TName };
export function createFileInput<TName extends string>(input: any): FileInput & { name: TName } {
    return createInput({
        type: "file",
        renderer: "Webiny/FileManager",
        ...input
    }) as FileInput & { name: TName };
}

// Date
export function createDateInput<TName extends string>(
    input: { name: TName } & Omit<DateTimeInput, "type" | "name">
): DateTimeInput & { name: TName };
export function createDateInput<TName extends string>(
    input: Omit<DateTimeInput, "type" | "name">
): DateTimeInput & { name: TName };
export function createDateInput<TName extends string>(input: any): DateTimeInput & { name: TName } {
    return createInput({
        type: "datetime",
        renderer: "Webiny/DateTime",
        ...input
    }) as DateTimeInput & { name: TName };
}

// Rich Text
export function createLexicalInput<TName extends string>(
    input: { name: TName } & Omit<LexicalInput, "type" | "name">
): LexicalInput & { name: TName };
export function createLexicalInput<TName extends string>(
    input: Omit<LexicalInput, "type" | "name">
): LexicalInput & { name: TName };
export function createLexicalInput<TName extends string>(
    input: any
): LexicalInput & { name: TName } {
    return createInput({
        type: "lexical",
        renderer: "Webiny/Lexical",
        ...input
    }) as LexicalInput & { name: TName };
}

// Select
export function createSelectInput<TName extends string>(
    input: { name: TName } & Omit<SelectInput, "type" | "name">
): SelectInput & { name: TName };
export function createSelectInput<TName extends string>(
    input: Omit<SelectInput, "type" | "name">
): SelectInput & { name: TName };
export function createSelectInput<TName extends string>(input: any): SelectInput & { name: TName } {
    return createInput({
        type: "select",
        renderer: "Webiny/Select",
        ...input
    }) as SelectInput & { name: TName };
}

// Radio
export function createRadioInput<TName extends string>(
    input: { name: TName } & Omit<RadioInput, "type" | "name">
): RadioInput & { name: TName };
export function createRadioInput<TName extends string>(
    input: Omit<RadioInput, "type" | "name">
): RadioInput & { name: TName };
export function createRadioInput<TName extends string>(input: any): RadioInput & { name: TName } {
    return createInput({
        type: "radio",
        renderer: "Webiny/RadioGroup",
        ...input
    }) as RadioInput & { name: TName };
}

// Object
export function createObjectInput<TName extends string>(
    input: { name: TName } & Omit<ObjectInput, "type" | "name">
): ObjectInput & { name: TName };
export function createObjectInput<TName extends string>(
    input: Omit<ObjectInput, "type" | "name">
): ObjectInput & { name: TName };
export function createObjectInput<TName extends string>(input: any): ObjectInput & { name: TName } {
    return createInput({
        type: "object",
        renderer: "Webiny/Object",
        ...input
    }) as ObjectInput & { name: TName };
}

// Tags
export function createTagsInput<TName extends string>(
    input: { name: TName } & Omit<TagsInput, "type" | "name">
): TagsInput & { name: TName };
export function createTagsInput<TName extends string>(
    input: Omit<TagsInput, "type" | "name">
): TagsInput & { name: TName };
export function createTagsInput<TName extends string>(input: any): TagsInput & { name: TName } {
    return createInput({
        type: "text",
        list: true,
        renderer: "Webiny/Tags",
        ...input
    }) as TagsInput & { name: TName };
}

export function createSlotInput<TName extends string>(
    input: { name: TName } & Omit<SlotInput, "type" | "name">
): SlotInput & { name: TName };
export function createSlotInput<TName extends string>(
    input: Omit<SlotInput, "type" | "name">
): SlotInput & { name: TName };
export function createSlotInput<TName extends string>(input: any): SlotInput & { name: TName } {
    return createInput({
        type: "slot",
        list: true,
        renderer: "Webiny/Slot",
        defaultValue: [],
        ...input
    }) as SlotInput & { name: TName };
}

// Content Entry
export function createContentEntryInput<TName extends string>(
    input: { name: TName } & Omit<ContentEntryInput, "type" | "name">
): ContentEntryInput & { name: TName };
export function createContentEntryInput<TName extends string>(
    input: Omit<ContentEntryInput, "type" | "name">
): ContentEntryInput & { name: TName };
export function createContentEntryInput<TName extends string>(
    input: any
): ContentEntryInput & { name: TName } {
    return createInput({
        type: "contentEntry",
        renderer: "Webiny/ContentEntry",
        ...input
    }) as ContentEntryInput & { name: TName };
}

// Implementation
export function createInput(input: ComponentInput): ComponentInput {
    if (input.onChange) {
        // @ts-expect-error We don't use this function on the frontend, so this is ok.
        input.onChange = functionConverter.serialize(input.onChange!);
    }
    return input;
}

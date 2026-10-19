import { FIELD_RENDERER_RUNTIME_NAMES } from "~/shared/adminExtensions/fieldRendererRuntime.js";
import { FIELD_RENDERER_FIELD_TYPES } from "~/shared/adminExtensions/fieldRendererRuntime.js";

/**
 * The rules a generated renderer is written against, as the assistant reads them. The names in
 * scope come from the same list the wrapper and the admin runtime use, so the three cannot drift.
 *
 * Component props are spelled out where a plausible guess is wrong, because React drops an unknown
 * prop without complaint and the mistake only shows on screen.
 */
export function describeFieldRendererContract(): string {
    const names = FIELD_RENDERER_RUNTIME_NAMES.join(", ");
    const fieldTypes = FIELD_RENDERER_FIELD_TYPES.join(", ");

    return [
        "Write the renderer as TSX with no import, export or require. TypeScript annotations are fine.",
        `In scope: ${names}.`,
        "Declare it as `const Renderer = createFieldRenderer(({ field }) => ...)`.",
        "`field`: value, onChange(value), onBlur(), label, help, description, note, placeholder, required, disabled, isList, addItem(value?), removeItem(index), and validation, which is one object `{ isValid: boolean | null, message?: string }`, not a list of rules.",
        "Components: Input and Textarea take label, value, onChange(value), placeholder, description, note, required, disabled and validation. Text and Heading render their children and take no `text` prop. Button takes `text` and onClick. Switch and Checkbox take label, checked and onChange(checked). Tag takes `content` and `variant`. Alert takes `type` and `title`. DelayedOnChange wraps one input and debounces its value and onChange.",
        `Field types a renderer can target: ${fieldTypes}.`
    ].join("\n");
}

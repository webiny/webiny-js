import type { CreateAdminExtensionUseCase } from "~/api/adminExtensions/features/CreateAdminExtension/abstractions.js";

// A renderer that compiles: a text input with a character count under it.
export const CHAR_COUNT_SOURCE = `
const Renderer = createFieldRenderer(({ field }) => {
    const value: string = typeof field.value === "string" ? field.value : "";
    return (
        <div>
            <Input
                label={field.label}
                value={value}
                onChange={(next: string) => field.onChange(next)}
                validation={field.validation}
            />
            <Text size="sm">{value.length} characters</Text>
        </div>
    );
});
`;

export const CHAR_COUNT_INPUT: CreateAdminExtensionUseCase.Input = {
    kind: "fieldRenderer",
    name: "char-count",
    label: "Character count",
    description: "A text input with a character count under it.",
    source: CHAR_COUNT_SOURCE,
    config: JSON.stringify({ fieldType: "text", multipleValues: false })
};

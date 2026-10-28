import React from "react";
import { ColorPicker } from "@webiny/admin-ui";
import { FormComponentErrorMessage } from "@webiny/admin-ui";
import { FormComponentLabel } from "@webiny/admin-ui";
import { Input } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { RadioGroup } from "@webiny/admin-ui";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import { isHexColour } from "~/editor/domain/isHexColour.js";
import { STEP_COLOURS } from "~/editor/domain/stepColours.js";
import "../stepFormRendererNames.js";

const FALLBACK_PICKER_COLOUR = "#FA5723";

// The hex box always starts with `#`; an empty box stays empty.
const normalizeHexInput = (text: string): string => {
    const trimmed = text.trim();
    if (trimmed === "" || trimmed.startsWith("#")) {
        return trimmed;
    }
    return `#${trimmed}`;
};

/*
 * Colour (R273, UI-2): ten preset swatches as a radio group, an admin-ui colour picker and a hex
 * box. The field value is the raw text, so an unfinished hex stays in the field and shows its error.
 */
export const StepColourRenderer = createFieldRenderer<"workflowStepColour">(({ field }) => {
    const value = typeof field.value === "string" ? field.value : "";
    const isCustom = value.startsWith("#");
    const invalid = field.validation.isValid === false;
    const pickerValue = isHexColour(value) ? value : FALLBACK_PICKER_COLOUR;

    const presets = STEP_COLOURS.map(colour => ({
        id: `step-colour-${colour.label}`,
        value: colour.value,
        label: <Tag content={colour.label} swatchColor={colour.value} />
    }));

    return (
        <div className={"w-full"}>
            <FormComponentLabel
                text={field.label}
                required
                disabled={field.disabled}
                invalid={invalid}
            />
            <div role={"group"} aria-label={"Colour"} className={"flex flex-col gap-sm"}>
                <RadioGroup
                    aria-label={"Preset colour"}
                    items={presets}
                    value={isCustom ? "" : value}
                    disabled={field.disabled}
                    onChange={preset => field.onChange(preset)}
                />
                <div className={"flex items-end gap-sm"}>
                    <ColorPicker
                        label={"Custom colour"}
                        value={pickerValue}
                        disabled={field.disabled}
                        onChangeComplete={picked => field.onChange(picked.toUpperCase())}
                    />
                    <Input
                        label={"Hex colour"}
                        placeholder={"#3B6FD4"}
                        maxLength={7}
                        value={isCustom ? value : ""}
                        disabled={field.disabled}
                        invalid={invalid}
                        onChange={typed => field.onChange(normalizeHexInput(typed))}
                    />
                </div>
            </div>
            <FormComponentErrorMessage
                text={field.validation.message}
                invalid={invalid}
                disabled={field.disabled}
            />
        </div>
    );
});

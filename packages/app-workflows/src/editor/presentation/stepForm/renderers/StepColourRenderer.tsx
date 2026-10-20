import React from "react";
import { FormComponentErrorMessage } from "@webiny/admin-ui";
import { FormComponentLabel } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
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
 * Colour (R273, UI-2): ten preset swatches, a native colour input and a hex box. The field value is
 * the raw text, so an unfinished hex stays in the field and shows its error.
 */
export const StepColourRenderer = createFieldRenderer<"workflowStepColour">(({ field }) => {
    const value = typeof field.value === "string" ? field.value : "";
    const isCustom = value.startsWith("#");
    const invalid = field.validation.isValid === false;
    const pickerValue = isHexColour(value) ? value : FALLBACK_PICKER_COLOUR;

    return (
        <div className={"w-full"}>
            <FormComponentLabel
                text={field.label}
                required
                disabled={field.disabled}
                invalid={invalid}
            />
            <div
                role={"group"}
                aria-label={"Colour"}
                className={"flex flex-wrap items-center gap-sm"}
            >
                {STEP_COLOURS.map(colour => {
                    const selected = colour.value === value;
                    return (
                        <button
                            key={colour.value}
                            type={"button"}
                            title={colour.label}
                            aria-label={colour.label}
                            aria-pressed={selected}
                            disabled={field.disabled}
                            onClick={() => field.onChange(colour.value)}
                            className={cn(
                                "size-7 shrink-0 cursor-pointer rounded-full border-0 p-0",
                                selected && "ring-2 ring-neutral-xstrong ring-offset-2"
                            )}
                            style={{ background: colour.value }}
                        />
                    );
                })}
                <span aria-hidden={true} className={"mx-xs h-6 w-px bg-neutral-muted"} />
                <input
                    type={"color"}
                    title={"Pick a custom colour"}
                    aria-label={"Custom colour"}
                    value={pickerValue}
                    disabled={field.disabled}
                    onChange={event => {
                        const picked = event.target.value.toUpperCase();
                        field.onChange(picked);
                    }}
                    className={"size-7 shrink-0 cursor-pointer rounded-full border-0 p-0"}
                />
                <input
                    type={"text"}
                    aria-label={"Hex colour"}
                    placeholder={"#3B6FD4"}
                    maxLength={7}
                    value={isCustom ? value : ""}
                    disabled={field.disabled}
                    onChange={event => {
                        const typed = normalizeHexInput(event.target.value);
                        field.onChange(typed);
                    }}
                    className={cn(
                        "w-24 rounded border px-sm py-xs font-mono text-sm",
                        invalid ? "border-destructive-default" : "border-neutral-muted"
                    )}
                />
            </div>
            <FormComponentErrorMessage
                text={field.validation.message}
                invalid={invalid}
                disabled={field.disabled}
            />
        </div>
    );
});

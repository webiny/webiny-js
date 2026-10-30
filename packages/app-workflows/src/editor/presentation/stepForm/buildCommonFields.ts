import { z } from "zod";
import type { FormModelFactory } from "@webiny/app-admin";
import { isValidStepColour } from "./isValidStepColour.js";
import { STEP_FORM_MESSAGES } from "./stepFormMessages.js";
import { STEP_FORM_RENDERER } from "./stepFormRendererNames.js";
import { validateAfterChange } from "./validateAfterChange.js";

const colourSchema = z
    .string()
    .refine(isValidStepColour, { message: STEP_FORM_MESSAGES.hexColour });

export interface CommonFieldsParams {
    registry: FormModelFactory.FieldBuilderRegistry;
    descriptionPlaceholder: string;
    // The AI step without the licence (R275): every field is disabled.
    readOnly: boolean;
}

export interface CommonFieldBuilders {
    title: FormModelFactory.FieldBuilder;
    color: FormModelFactory.FieldBuilder;
    description: FormModelFactory.FieldBuilder;
    notifications: FormModelFactory.FieldBuilder;
}

// Title, Colour, Description and Notify via: the fields every step has (R270). The type's builder places them.
export const buildCommonFields = (params: CommonFieldsParams): CommonFieldBuilders => {
    const { registry, descriptionPlaceholder, readOnly } = params;

    const title = registry
        .text()
        .label("Title")
        .placeholder("e.g. Legal sign-off")
        .required(STEP_FORM_MESSAGES.titleRequired)
        .afterChange(validateAfterChange("title"))
        .disabled(readOnly);

    const color = registry
        .text()
        .label("Colour")
        .renderer(STEP_FORM_RENDERER.colour)
        .schema(colourSchema)
        .afterChange(validateAfterChange("color"))
        .disabled(readOnly);

    const description = registry
        .text()
        .label("Description")
        .placeholder(descriptionPlaceholder)
        .renderer("textarea", { rows: 3 })
        .disabled(readOnly);

    const notifications = registry
        .text()
        .list()
        .label("Notify via")
        .description(STEP_FORM_MESSAGES.notifyHint)
        .renderer(STEP_FORM_RENDERER.transports)
        .disabled(readOnly);

    return { title, color, description, notifications };
};

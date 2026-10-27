import React from "react";
import { Button } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import { WorkflowPicker } from "~/components/picker/WorkflowPicker.js";
import { AI_FORM_MESSAGES } from "../aiFormMessages.js";
import { useStepFormOptions } from "../useStepFormOptions.js";
import "../stepFormRendererNames.js";

/*
 * Model (R275, QBZ-8, QBZ-89): the single picker over `listAiModels`. A failed or empty list
 * disables it and says why; the stored model stays shown (the options carry it as `selected`, with
 * the retired warning when the loaded list does not offer it). The picker draws the label, the
 * description and the required marker.
 */
export const AiModelPickerRenderer = createFieldRenderer<"workflowAiModel">(({ field }) => {
    const { aiModels } = useStepFormOptions();
    const invalid = field.validation.isValid === false;
    const error = invalid ? (field.validation.message ?? null) : null;
    const value = typeof field.value === "string" ? field.value : null;

    return (
        <div className={"flex w-full flex-col gap-xs"}>
            <WorkflowPicker
                label={field.label ?? ""}
                description={field.description}
                required={field.required}
                value={value}
                selected={aiModels.selected}
                options={aiModels.options}
                onSearch={aiModels.search}
                onChange={id => field.onChange(id)}
                placeholder={AI_FORM_MESSAGES.modelPlaceholder}
                disabled={field.disabled || aiModels.failed || aiModels.empty}
                error={error}
            />
            {aiModels.failed && (
                <div className={"flex items-center gap-sm text-destructive-primary"}>
                    <Text size={"sm"}>{AI_FORM_MESSAGES.modelsFailed}</Text>
                    <Button
                        variant={"ghost"}
                        size={"sm"}
                        text={AI_FORM_MESSAGES.retry}
                        onClick={aiModels.retry}
                    />
                </div>
            )}
            {aiModels.empty && <Text size={"sm"}>{AI_FORM_MESSAGES.modelsEmpty}</Text>}
        </div>
    );
});

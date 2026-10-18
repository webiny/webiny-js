import React from "react";
import { Alert } from "@webiny/admin-ui";
import { FormComponentLabel } from "@webiny/admin-ui";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import { WorkflowMultiPicker } from "~/components/picker/WorkflowMultiPicker.js";
import { WorkflowPicker } from "~/components/picker/WorkflowPicker.js";
import { STEP_FORM_MESSAGES } from "../stepFormMessages.js";
import { useStepFormOptions } from "../useStepFormOptions.js";
import "../stepFormRendererNames.js";

/*
 * Teams (R282): the chip picker of the People step's `teams` list, and a clearable single picker
 * for a plain text field (the `team` ui hint of an automation setting, R271). Both read the team
 * list the drawer provides; the pickers draw the label, the description and the required marker.
 */
export const TeamsPickerRenderer = createFieldRenderer<"workflowTeamsPicker">(({ field }) => {
    const { teams } = useStepFormOptions();
    const invalid = field.validation.isValid === false;
    const error = invalid ? (field.validation.message ?? null) : null;
    const label = field.label ?? "";

    if (teams.failed) {
        return (
            <div className={"w-full"}>
                <FormComponentLabel
                    text={field.label}
                    required={field.required}
                    disabled={field.disabled}
                    invalid={invalid}
                />
                <Alert
                    type={"danger"}
                    variant={"subtle"}
                    actions={
                        <Alert.Action text={STEP_FORM_MESSAGES.tryAgain} onClick={teams.retry} />
                    }
                >
                    {STEP_FORM_MESSAGES.optionsFailed}
                </Alert>
            </div>
        );
    }

    if (field.isList) {
        const values: string[] = Array.isArray(field.value) ? field.value : [];
        return (
            <WorkflowMultiPicker
                label={label}
                description={field.description}
                required={field.required}
                values={values}
                selected={teams.selected}
                options={teams.options}
                onSearch={teams.search}
                onChange={ids => field.onChange(ids)}
                placeholder={STEP_FORM_MESSAGES.teamsPlaceholder}
                disabled={field.disabled}
                error={error}
            />
        );
    }

    const value = typeof field.value === "string" ? field.value : null;
    const selected =
        teams.selected.find(option => option.id === value) ??
        teams.options.find(option => option.id === value) ??
        null;

    return (
        <WorkflowPicker
            label={label}
            description={field.description}
            required={field.required}
            value={value}
            selected={selected}
            options={teams.options}
            onSearch={teams.search}
            onChange={id => field.onChange(id)}
            placeholder={STEP_FORM_MESSAGES.teamsPlaceholder}
            disabled={field.disabled}
            error={error}
        />
    );
});

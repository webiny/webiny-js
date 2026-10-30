import React from "react";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import { ASSIGNMENT_FORM_MESSAGES } from "../assignmentFormMessages.js";
import { UserPickerControl } from "../components/UserPickerControl.js";
import { getTeamNames } from "../getTeamNames.js";
import { useStepFormOptions } from "../useStepFormOptions.js";
import "../stepFormRendererNames.js";

/*
 * A single user (R285, R307): the `user` ui hint of an Automation setting, a `text` field holding
 * the user id. It reads the user search and the resolved references from the options the drawer
 * provides; the label, description, required marker, disabled flag and error come from the field.
 */
export const UserPickerRenderer = createFieldRenderer<"workflowUserPicker">(({ field }) => {
    const { users, references, teams } = useStepFormOptions();
    const invalid = field.validation.isValid === false;
    const error = invalid ? (field.validation.message ?? null) : null;
    const value = typeof field.value === "string" && field.value !== "" ? field.value : null;
    const teamNames = getTeamNames(teams, references);

    return (
        <UserPickerControl
            label={field.label ?? ""}
            description={field.description}
            required={field.required}
            placeholder={ASSIGNMENT_FORM_MESSAGES.searchUsersPlaceholder}
            anyLabel={null}
            value={value}
            users={users}
            references={references}
            teamNames={teamNames}
            disabled={field.disabled}
            error={error}
            onChange={id => field.onChange(id)}
        />
    );
});

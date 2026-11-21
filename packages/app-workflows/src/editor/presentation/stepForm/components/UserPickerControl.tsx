import React from "react";
import type { PickerFieldIcon } from "~/components/picker/PickerFieldIcon.js";
import type { PickerSize } from "~/components/picker/PickerSize.js";
import { WorkflowPicker } from "~/components/picker/WorkflowPicker.js";
import type { WorkflowUserSummary } from "~/editor/domain/types.js";
import { getReferenceSelection } from "../getReferenceSelection.js";
import type { StepFormReferencesOptions } from "../StepFormOptions.js";
import type { StepFormUsersOptions } from "../StepFormOptions.js";
import { toUserPickerOption } from "../toUserPickerOption.js";
import { PickerLoadFailed } from "./PickerLoadFailed.js";

export interface UserPickerControlProps {
    label: string;
    description?: string;
    required?: boolean;
    placeholder: string;
    // The clear row (`Anyone`) or null for none.
    anyLabel: string | null;
    value: string | null;
    users: StepFormUsersOptions;
    references: StepFormReferencesOptions;
    // The names of the teams the form knows, for the sub line of a user.
    teamNames: ReadonlyMap<string, string>;
    disabled: boolean;
    error: string | null;
    // The leading icon of the field; the picker's default when not set.
    icon?: PickerFieldIcon;
    // The height of the field; the picker's default (`lg`) when not set.
    size?: PickerSize;
    // Show the clear row's label as the value while nothing is chosen (see `WorkflowPicker`).
    anyAsValue?: boolean;
    // Whether a chosen value has the × button; the picker's default (true) when not set.
    clearable?: boolean;
    onChange(userId: string | null): void;
}

/*
 * A single user picker (R307, R315, D117): the user search results as options, the saved value
 * resolved by id when no search result or pick holds it (a deleted user shows as muted `Deleted
 * user`). A failed list shows the options banner with `Try again` in place of the picker.
 */
export const UserPickerControl = (props: UserPickerControlProps) => {
    const { users, references, teamNames, value } = props;

    if (users.failed) {
        return (
            <PickerLoadFailed
                label={props.label}
                required={props.required}
                disabled={props.disabled}
                error={props.error}
                onRetry={users.retry}
            />
        );
    }

    const toOption = (user: WorkflowUserSummary) => toUserPickerOption(user, teamNames);
    const options = users.items.map(toOption);
    const chosen = users.selected.map(toOption);
    const known = [...chosen, ...options];
    const selected = getReferenceSelection({ id: value, kind: "user", known, references });

    return (
        <WorkflowPicker
            label={props.label}
            description={props.description}
            required={props.required}
            placeholder={props.placeholder}
            anyLabel={props.anyLabel}
            value={value}
            selected={selected}
            options={options}
            onSearch={users.searchUsers}
            onChange={props.onChange}
            disabled={props.disabled}
            error={props.error}
            icon={props.icon}
            size={props.size}
            anyAsValue={props.anyAsValue}
            clearable={props.clearable}
        />
    );
};

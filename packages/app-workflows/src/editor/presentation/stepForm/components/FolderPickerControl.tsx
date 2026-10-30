import React from "react";
import { useState } from "react";
import { Button } from "@webiny/admin-ui";
import { FormComponentNote } from "@webiny/admin-ui";
import { WorkflowPicker } from "~/components/picker/WorkflowPicker.js";
import { ASSIGNMENT_FORM_MESSAGES } from "../assignmentFormMessages.js";
import { filterPickerOptions } from "../filterPickerOptions.js";
import { getReferenceSelection } from "../getReferenceSelection.js";
import { isRestrictedFolder } from "../isRestrictedFolder.js";
import type { StepFormFoldersOptions } from "../StepFormOptions.js";
import type { StepFormReferencesOptions } from "../StepFormOptions.js";
import { toFolderPickerOption } from "../toFolderPickerOption.js";
import { PickerLoadFailed } from "./PickerLoadFailed.js";

export interface FolderPickerControlProps {
    label: string;
    description?: string;
    placeholder: string;
    // The clear row (`Any folder`) or null for none.
    anyLabel: string | null;
    // The saved folder id.
    value: string | null;
    folders: StepFormFoldersOptions;
    references: StepFormReferencesOptions;
    disabled: boolean;
    error: string | null;
    // The restricted folder's `Remove` (QBZ-15); null when the control has no such button.
    onRemove: (() => void) | null;
    onChange(folderId: string | null): void;
}

/*
 * A single folder picker (R292, R307, D117): the complete folder list filtered on the client by the
 * typed text, the saved id shown by its path when listed, else as `Deleted folder` or, for a
 * folder the admin cannot see, as the disabled `Restricted folder` with a `Remove` button and the
 * hint (QBZ-15). The search text is the only state, and it is visual.
 */
export const FolderPickerControl = (props: FolderPickerControlProps) => {
    const { folders, references, value, onRemove } = props;
    const [query, setQuery] = useState("");

    if (folders.failed) {
        return (
            <PickerLoadFailed
                label={props.label}
                disabled={props.disabled}
                error={props.error}
                onRetry={folders.retry}
            />
        );
    }

    const options = folders.items.map(toFolderPickerOption);
    const shown = filterPickerOptions(options, query);
    const selected = getReferenceSelection({
        id: value,
        kind: "folder",
        known: options,
        references
    });
    const restricted = isRestrictedFolder(value, folders, references);

    const picker = (
        <WorkflowPicker
            label={props.label}
            description={props.description}
            placeholder={props.placeholder}
            anyLabel={props.anyLabel}
            value={value}
            selected={selected}
            options={shown}
            onSearch={setQuery}
            onChange={props.onChange}
            disabled={props.disabled || restricted}
            error={props.error}
        />
    );

    if (!restricted) {
        return picker;
    }

    return (
        <div className={"flex w-full flex-col gap-xs"}>
            <div className={"flex items-end gap-sm"}>
                <div className={"min-w-0 grow"}>{picker}</div>
                {onRemove !== null && (
                    <Button
                        variant={"ghost"}
                        size={"sm"}
                        text={ASSIGNMENT_FORM_MESSAGES.removeFolder}
                        title={ASSIGNMENT_FORM_MESSAGES.removeFolderTitle}
                        disabled={props.disabled}
                        onClick={onRemove}
                    />
                )}
            </div>
            <FormComponentNote text={ASSIGNMENT_FORM_MESSAGES.restrictedFolderHint} />
        </div>
    );
};

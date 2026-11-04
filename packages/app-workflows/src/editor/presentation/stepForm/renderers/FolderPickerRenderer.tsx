import React from "react";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import { ASSIGNMENT_FORM_MESSAGES } from "../assignmentFormMessages.js";
import { FolderPickerControl } from "../components/FolderPickerControl.js";
import { useStepFormOptions } from "../useStepFormOptions.js";
import "../stepFormRendererNames.js";

/*
 * A single folder (R292, R307): a `text` field holding a folder id, over the app's folder list. A
 * restricted folder is disabled and its `Remove` clears the field (QBZ-15). No 9b form field uses
 * it: the rule card and Test routing compose `FolderPickerControl` or a plain picker themselves.
 */
export const FolderPickerRenderer = createFieldRenderer<"workflowFolderPicker">(({ field }) => {
    const { folders, references } = useStepFormOptions();
    const invalid = field.validation.isValid === false;
    const error = invalid ? (field.validation.message ?? null) : null;
    const value = typeof field.value === "string" && field.value !== "" ? field.value : null;

    return (
        <FolderPickerControl
            label={field.label ?? ""}
            description={field.description}
            placeholder={ASSIGNMENT_FORM_MESSAGES.searchFoldersPlaceholder}
            anyLabel={ASSIGNMENT_FORM_MESSAGES.anyFolder}
            value={value}
            folders={folders}
            references={references}
            disabled={field.disabled}
            error={error}
            onRemove={() => field.onChange(null)}
            onChange={folderId => field.onChange(folderId)}
        />
    );
});

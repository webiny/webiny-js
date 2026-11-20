import React, { useState } from "react";
import { Button } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { EditableTitle } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { FormComponentErrorMessage } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { SimpleFormHeader } from "@webiny/app-admin";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import type { WorkflowHeaderVm } from "~/editor/presentation/editor/abstractions.js";

export interface EditorHeaderProps {
    header: WorkflowHeaderVm;
    onNameChange(name: string): void;
    onSave(): void;
    onDelete(): void;
}

// The card's header: name, Unsaved changes tag, applies-to line, Delete workflow, Save (design README 3).
export const EditorHeader = ({ header, onNameChange, onSave, onDelete }: EditorHeaderProps) => {
    let saveText = "Save";
    if (header.saving) {
        saveText = "Saving…";
    }
    const saveDisabled = !header.canSave || header.saving;
    const deleteDisabled = !header.canDelete || header.saving;

    const handleDelete = () => {
        if (deleteDisabled) {
            return;
        }
        onDelete();
    };

    // The resting title of EditableTitle is a plain div, so the keyboard trigger wraps it here.
    const [editingName, setEditingName] = useState(false);
    const nameTriggerEnabled = !editingName && !header.saving;
    const handleNameKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.target !== event.currentTarget) {
            return;
        }
        if (event.key === "Enter" || event.key === "F2") {
            event.preventDefault();
            setEditingName(true);
        }
    };

    let nameTitle: React.ReactNode = (
        <EditableTitle
            value={header.name}
            onCommit={onNameChange}
            readOnly={header.saving}
            isEditing={editingName}
            onEditingChange={setEditingName}
        />
    );
    if (!header.name && nameTriggerEnabled) {
        nameTitle = (
            <div className="px-sm-extra" onClick={() => setEditingName(true)}>
                <Text size="lg">Untitled workflow</Text>
            </div>
        );
    }

    let unsavedTag: React.ReactNode = null;
    if (header.dirty) {
        unsavedTag = <Tag variant="warning" content="Unsaved changes" />;
    }

    let nameError: React.ReactNode = null;
    if (header.nameError) {
        nameError = <FormComponentErrorMessage invalid text={header.nameError} />;
    }

    // `SimpleFormHeader` has no description slot, so the applies-to line sits in the title node.
    const title = (
        <div className="flex flex-col gap-xxs min-w-0">
            <div data-role="title-row" className="flex items-center gap-sm min-w-0">
                <div
                    className="min-w-0"
                    tabIndex={nameTriggerEnabled ? 0 : undefined}
                    role={nameTriggerEnabled ? "button" : undefined}
                    aria-label={nameTriggerEnabled ? "Workflow name" : undefined}
                    onClick={nameTriggerEnabled ? () => setEditingName(true) : undefined}
                    onKeyDown={nameTriggerEnabled ? handleNameKeyDown : undefined}
                >
                    {nameTitle}
                </div>
                {unsavedTag}
            </div>
            {nameError}
            <Text as="div" size="sm" className="text-neutral-strong">
                {header.appliesTo}
            </Text>
        </div>
    );

    return (
        <SimpleFormHeader title={title} data-testid="workflow-editor-header">
            <div data-role="header-actions" className="flex items-center justify-end gap-xs">
                <IconButton
                    variant="ghost"
                    aria-label="Delete workflow"
                    title="Delete workflow"
                    icon={<DeleteIcon />}
                    disabled={deleteDisabled}
                    onClick={handleDelete}
                />
                <Button
                    variant="primary"
                    size="sm"
                    text={saveText}
                    disabled={saveDisabled}
                    onClick={onSave}
                />
            </div>
        </SimpleFormHeader>
    );
};

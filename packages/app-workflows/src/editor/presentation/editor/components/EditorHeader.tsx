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

    // `SimpleFormHeader` gives half of its width to its children, so it gets none here: the title
    // column then spans the whole header and this row lays out the name block and the actions.
    const title = (
        <div className="flex items-center gap-sm min-w-0">
            <div className="flex flex-col gap-xxs min-w-0 grow">
                <div data-role="title-row" className="flex items-center gap-sm min-w-0">
                    <div
                        className="min-w-0 [&_*]:text-neutral-primary"
                        tabIndex={nameTriggerEnabled ? 0 : undefined}
                        role={nameTriggerEnabled ? "button" : undefined}
                        aria-label={nameTriggerEnabled ? "Workflow name" : undefined}
                        onClick={nameTriggerEnabled ? () => setEditingName(true) : undefined}
                        onKeyDown={nameTriggerEnabled ? handleNameKeyDown : undefined}
                    >
                        {nameTitle}
                    </div>
                    <div className="shrink-0">{unsavedTag}</div>
                </div>
                {nameError}
                <Text
                    as="div"
                    size="sm"
                    className="min-w-0 truncate text-neutral-strong"
                    title={header.appliesTo}
                >
                    {header.appliesTo}
                </Text>
            </div>
            <div data-role="header-actions" className="flex shrink-0 items-center gap-xs">
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
        </div>
    );

    return <SimpleFormHeader title={title} data-testid="workflow-editor-header" />;
};

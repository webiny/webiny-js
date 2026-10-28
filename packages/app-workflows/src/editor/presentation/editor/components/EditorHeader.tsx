import React from "react";
import { Button } from "@webiny/admin-ui";
import { DropdownMenu } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { EditableTitle } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as MoreHorizIcon } from "@webiny/icons/more_horiz.svg";
import { ReactComponent as SaveIcon } from "@webiny/icons/save.svg";
import type { WorkflowHeaderVm } from "~/editor/presentation/editor/abstractions.js";

export interface EditorHeaderProps {
    header: WorkflowHeaderVm;
    onNameChange(name: string): void;
    onSave(): void;
    onDelete(): void;
}

// The sticky header: name, Unsaved changes tag, applies-to line, the menu and Save (design README 3).
export const EditorHeader = ({ header, onNameChange, onSave, onDelete }: EditorHeaderProps) => {
    let saveText = "Save";
    if (header.saving) {
        saveText = "Saving…";
    }
    const saveDisabled = !header.canSave || header.saving;
    const deleteDisabled = !header.canDelete || header.saving;

    // The item's onClick sits on an inner element that still fires when the item is disabled.
    const handleDelete = () => {
        if (deleteDisabled) {
            return;
        }
        onDelete();
    };

    let unsavedTag: React.ReactNode = null;
    if (header.dirty) {
        unsavedTag = <Tag variant="warning" content="Unsaved changes" />;
    }

    let nameError: React.ReactNode = null;
    if (header.nameError) {
        nameError = (
            <Text size="sm" className="text-destructive-primary">
                {header.nameError}
            </Text>
        );
    }

    return (
        <div className="sticky top-0 z-10 flex items-start justify-between gap-md px-lg py-md bg-neutral-base border-b border-neutral-dimmed">
            <div className="flex flex-col gap-xs grow min-w-0 max-w-[560px]">
                <div className="flex items-center gap-sm">
                    <div className="grow">
                        <EditableTitle
                            value={header.name}
                            onCommit={onNameChange}
                            readOnly={header.saving}
                        />
                    </div>
                    {unsavedTag}
                </div>
                {nameError}
                <Text size="sm" className="text-neutral-strong">
                    {header.appliesTo}
                </Text>
            </div>
            <div className="flex flex-col items-end gap-xs shrink-0">
                <div className="flex items-center gap-xs">
                    <DropdownMenu
                        align="end"
                        side="bottom"
                        trigger={
                            <IconButton
                                variant="ghost"
                                aria-label="More actions"
                                title="More actions"
                                icon={<MoreHorizIcon />}
                            />
                        }
                    >
                        <DropdownMenu.Item
                            variant="destructive"
                            text="Delete workflow"
                            disabled={deleteDisabled}
                            onClick={handleDelete}
                        />
                    </DropdownMenu>
                    <Button
                        variant="primary"
                        text={saveText}
                        icon={<SaveIcon />}
                        disabled={saveDisabled}
                        onClick={onSave}
                    />
                </div>
                <Text size="sm" className="text-neutral-strong">
                    Changes apply to new review requests; reviews already running are not affected.
                </Text>
            </div>
        </div>
    );
};

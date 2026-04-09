import React, { useCallback } from "react";
import { cn, FormComponentLabel } from "@webiny/admin-ui";
import { FolderTree } from "~/components/index.js";
import type { FolderDto } from "~/domain/folder/FolderDto.js";

export interface FolderPickerProps {
    label: string;
    value: string;
    onChange: (id: string) => void;
    enableCreate?: boolean;
}

export const FolderPicker = ({
    label,
    value,
    onChange,
    enableCreate = true
}: FolderPickerProps) => {
    const onFolderChange = useCallback(
        (folder: FolderDto) => {
            onChange(folder.id);
        },
        [onChange]
    );

    return (
        <div>
            <FormComponentLabel text={label} />
            <div
                className={cn([
                    "px-sm-extra py-sm-extra",
                    "border-sm border-neutral-muted rounded-md",
                    "bg-neutral-base",
                    "max-h-[280px] overflow-x-hidden overflow-y-scroll"
                ])}
            >
                <FolderTree
                    focusedFolderId={value}
                    onFolderClick={onFolderChange}
                    enableCreate={enableCreate}
                />
            </div>
        </div>
    );
};

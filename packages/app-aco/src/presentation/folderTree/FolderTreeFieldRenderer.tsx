import React, { useState } from "react";
import { cn, FormComponentLabel } from "@webiny/admin-ui";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import { FolderTree } from "~/components/FolderTree/index.js";
import { ROOT_FOLDER } from "~/constants.js";

declare module "@webiny/app-admin/features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        folderTree: { fieldType: "text"; options: false; settings: undefined };
    }
}

export const FolderTreeFieldRenderer = createFieldRenderer(({ field }) => {
    const [focusedId, setFocusedId] = useState<string>((field.value as string) || ROOT_FOLDER);

    return (
        <div>
            <FormComponentLabel text={field.label} />
            <div
                className={cn([
                    "px-sm-extra py-sm-extra",
                    "border-sm border-neutral-muted rounded-md",
                    "bg-neutral-base",
                    "max-h-[280px] overflow-x-hidden overflow-y-scroll"
                ])}
            >
                <FolderTree
                    focusedFolderId={focusedId}
                    onFolderClick={folder => {
                        setFocusedId(folder.id);
                        field.onChange(folder.id === ROOT_FOLDER ? null : folder.id);
                    }}
                />
            </div>
        </div>
    );
});

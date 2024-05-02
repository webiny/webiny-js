import React from "react";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete.svg";
import { useNavigateFolder } from "@webiny/app-aco";
import { usePermission } from "~/admin/hooks";
import { ContentEntryEditorConfig } from "~/admin/config/contentEntries";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/useContentEntry";

export const DeleteEntry = () => {
    const { navigateToLatestFolder } = useNavigateFolder();
    const { entry, contentModel, loading, ...contentEntry } = useContentEntry();
    const { canDelete } = usePermission();

    const { OptionsMenuItem } =
        ContentEntryEditorConfig.Actions.MenuItemAction.useOptionsMenuItem();

    const deleteEntry = async () => {
        const response = await contentEntry.deleteEntry({ id: entry.entryId });
        if (typeof response === "boolean") {
            navigateToLatestFolder();
        }
    };

    if (!canDelete(entry, "cms.contentEntry")) {
        return null;
    }

    return (
        <OptionsMenuItem
            icon={<DeleteIcon />}
            label={"Trash"}
            onAction={deleteEntry}
            disabled={!entry.id || loading}
            data-testid={"cms.content-form.header.delete"}
        />
    );
};

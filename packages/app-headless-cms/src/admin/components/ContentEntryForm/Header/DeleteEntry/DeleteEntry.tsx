import React, { useCallback } from "react";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/filled/delete.svg";
import { useRouter } from "@webiny/react-router";

import { usePermission } from "~/admin/hooks/usePermission";
import { ContentEntryEditorConfig } from "~/admin/config/contentEntries";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/useContentEntry";
import { useDeleteEntry } from "./useDeleteEntry";

export const DeleteEntry = () => {
    const { history } = useRouter();
    const { entry, contentModel, loading } = useContentEntry();
    const { canDelete } = usePermission();
    const { showConfirmationDialog } = useDeleteEntry();
    const { OptionsMenuItem } =
        ContentEntryEditorConfig.Actions.MenuItemAction.useOptionsMenuItem();

    const navigateBacktoList = useCallback(
        () => history.push("/cms/content-entries/" + contentModel.modelId),
        []
    );

    if (!canDelete(entry, "cms.contentEntry")) {
        return null;
    }

    return (
        <OptionsMenuItem
            icon={<DeleteIcon />}
            label={"Delete entry"}
            onAction={() =>
                showConfirmationDialog({
                    onAccept: navigateBacktoList
                })
            }
            disabled={!entry.id || loading}
            data-testid={"cms.content-form.header.delete"}
        />
    );
};

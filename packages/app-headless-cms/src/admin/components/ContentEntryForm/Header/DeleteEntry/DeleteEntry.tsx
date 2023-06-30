import React, { useCallback } from "react";
import { useRouter } from "@webiny/react-router";
import { OptionsMenuItem, useOptionsMenuItem } from "@webiny/app-admin";

import { usePermission } from "~/admin/hooks/usePermission";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/filled/delete.svg";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/useContentEntry";
import { useDeleteEntry } from "./useDeleteEntry";

export const DeleteEntry: React.FC = () => {
    const { history } = useRouter();
    const { entry, contentModel, loading } = useContentEntry();
    const { canDelete } = usePermission();
    const { showConfirmationDialog } = useDeleteEntry();
    const { OptionsMenuItem } = useOptionsMenuItem();

    if (!canDelete(entry, "cms.contentEntry")) {
        return null;
    }

    const navigateBacktoList = useCallback(
        () => history.push("/cms/content-entries/" + contentModel.modelId),
        []
    );

    return (
        <OptionsMenuItem
            icon={<DeleteIcon />}
            label={"Delete"}
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

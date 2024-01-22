import React, { useMemo } from "react";
import { ReactComponent as Edit } from "@material-design-icons/svg/outlined/edit.svg";
import { useFolders } from "@webiny/app-aco";
import { PageListConfig } from "~/admin/config/pages";
import { usePage } from "~/admin/views/Pages/hooks/usePage";
import { useCreatePageFrom } from "~/admin/views/Pages/hooks/useCreatePageFrom";
import { useNavigatePage } from "~/admin/hooks/useNavigatePage";
import { usePagesPermissions } from "~/hooks/permissions";

export const EditPage = () => {
    const { page } = usePage();
    const { folderLevelPermissions: flp } = useFolders();
    const { canUpdate: pagesCanUpdate } = usePagesPermissions();
    const { OptionsMenuItem, OptionsMenuLink } = PageListConfig.Browser.PageAction;
    const { getPageEditorUrl, navigateToPageEditor } = useNavigatePage();
    const { createPageForm, loading } = useCreatePageFrom({
        page,
        onSuccess: () => navigateToPageEditor(page.data.pid)
    });

    const { folderId } = page.location;
    const canEdit = useMemo(() => {
        return pagesCanUpdate(page.data.createdBy.id) && flp.canManageContent(folderId);
    }, [flp, folderId]);

    if (!canEdit) {
        return null;
    }

    if (page.data.locked) {
        return (
            <OptionsMenuItem
                icon={<Edit />}
                label={"Edit"}
                onAction={createPageForm}
                disabled={loading}
                data-testid={"aco.actions.pb.page.edit"}
            />
        );
    }

    return (
        <OptionsMenuLink
            icon={<Edit />}
            label={"Edit"}
            to={getPageEditorUrl(page.id)}
            data-testid={"aco.actions.pb.page.edit"}
        />
    );
};

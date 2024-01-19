import React from "react";
import { ReactComponent as Edit } from "@material-design-icons/svg/outlined/edit.svg";
import { PageListConfig } from "~/admin/config/pages";
import { usePage } from "~/admin/views/Pages/hooks/usePage";
import { useCreatePageFrom } from "~/admin/views/Pages/hooks/useCreatePageFrom";
import { useNavigatePage } from "~/admin/hooks/useNavigatePage";
import { usePagesPermissions } from "~/hooks/permissions";

export const EditPage = () => {
    const { page } = usePage();
    const { canUpdate } = usePagesPermissions();
    const { OptionsMenuItem, OptionsMenuLink } = PageListConfig.Browser.PageAction;
    const { getPageEditorUrl, navigateToPageEditor } = useNavigatePage();
    const { createPageForm, loading } = useCreatePageFrom({
        page,
        onSuccess: () => navigateToPageEditor(page.data.pid)
    });

    if (!canUpdate(page.data.createdBy.id)) {
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

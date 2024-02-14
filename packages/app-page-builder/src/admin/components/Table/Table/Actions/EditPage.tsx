import React from "react";
import { ReactComponent as Edit } from "@material-design-icons/svg/outlined/edit.svg";
import { makeDecoratable } from "@webiny/app-admin";
import { PageListConfig } from "~/admin/config/pages";
import { usePage } from "~/admin/views/Pages/hooks/usePage";
import { useCreatePageFrom } from "~/admin/views/Pages/hooks/useCreatePageFrom";
import { useNavigatePage } from "~/admin/hooks/useNavigatePage";

export const EditPage = makeDecoratable("EditPage", () => {
    const { page } = usePage();
    const { OptionsMenuItem, OptionsMenuLink } = PageListConfig.Browser.PageAction;
    const { getPageEditorUrl, navigateToPageEditor } = useNavigatePage();
    const { createPageForm, loading } = useCreatePageFrom({
        page,
        onSuccess: () => navigateToPageEditor(page.data.pid)
    });

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
});

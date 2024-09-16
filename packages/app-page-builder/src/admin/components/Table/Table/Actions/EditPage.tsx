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
    const { createPageFromMutation, loading } = useCreatePageFrom({
        page: page.data,
        onSuccess: data => navigateToPageEditor(data.id)
    });

    if (page.data.locked) {
        return (
            <OptionsMenuItem
                icon={<Edit />}
                label={"Edit"}
                onAction={createPageFromMutation}
                disabled={loading}
                data-testid={"aco.actions.pb.page.edit"}
            />
        );
    }

    return (
        <OptionsMenuLink
            icon={<Edit />}
            label={"Edit"}
            to={getPageEditorUrl(page.data.id)}
            data-testid={"aco.actions.pb.page.edit"}
        />
    );
});

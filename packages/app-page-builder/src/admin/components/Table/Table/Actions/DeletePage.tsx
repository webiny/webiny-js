import React from "react";
import { makeComposable } from "@webiny/app-admin";
import { ReactComponent as Delete } from "@material-design-icons/svg/outlined/delete.svg";
import { PageListConfig } from "~/admin/config/pages";
import { usePage } from "~/admin/views/Pages/hooks/usePage";
import { useDeletePage } from "~/admin/views/Pages/hooks/useDeletePage";

export const DeletePage = makeComposable("DeletePage", () => {
    const { page } = usePage();
    const { openDialogDeletePage } = useDeletePage({ page });
    const { OptionsMenuItem } = PageListConfig.Browser.PageAction;

    return (
        <OptionsMenuItem
            icon={<Delete />}
            label={"Delete"}
            onAction={openDialogDeletePage}
            data-testid={"aco.actions.pb.page.delete"}
        />
    );
});

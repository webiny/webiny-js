import React from "react";
import { ReactComponent as Visibility } from "@material-design-icons/svg/outlined/visibility.svg";
import { makeComposable } from "@webiny/app-admin";
import { PageListConfig } from "~/admin/config/pages";
import { usePage } from "~/admin/views/Pages/hooks/usePage";
import { usePreviewPage } from "~/admin/hooks/usePreviewPage";

export const PreviewPage = makeComposable("PreviewPage", () => {
    const { page } = usePage();
    const { previewPage } = usePreviewPage({
        id: page.id,
        status: page.data.status,
        path: page.data.path
    });
    const { OptionsMenuItem } = PageListConfig.Browser.PageAction;

    const label = page.data.status === "published" ? "View" : "Preview";

    return (
        <OptionsMenuItem
            icon={<Visibility />}
            label={label}
            onAction={previewPage}
            data-testid={"aco.actions.pb.page.preview"}
        />
    );
});

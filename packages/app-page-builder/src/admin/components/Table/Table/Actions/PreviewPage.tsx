import React from "react";
import { ReactComponent as Visibility } from "@material-design-icons/svg/outlined/visibility.svg";
import { PageListConfig } from "~/admin/config/pages";
import { usePage } from "~/admin/views/Pages/hooks/usePage";
import { usePreviewPage } from "~/admin/views/Pages/hooks/usePreviewPage";

export const PreviewPage = () => {
    const { page } = usePage();
    const { previewPage } = usePreviewPage({ page });
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
};

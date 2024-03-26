import React from "react";
import { ReactComponent as PreviewIcon } from "@material-design-icons/svg/round/visibility.svg";
import { usePage } from "~/pageEditor/hooks/usePage";
import { usePreviewPage } from "~/admin/hooks/usePreviewPage";
import { PageEditorConfig } from "~/pageEditor/editorConfig/PageEditorConfig";

const { TopBar } = PageEditorConfig;

export const PreviewPageOption = () => {
    const [page] = usePage();
    const { previewPage } = usePreviewPage({
        id: page.id,
        status: page.status,
        path: page.path
    });

    return (
        <TopBar.DropdownAction.MenuItem
            label={"Preview"}
            onClick={previewPage}
            icon={<PreviewIcon />}
            data-testid={"pb-editor-page-options-menu-preview"}
        />
    );
};

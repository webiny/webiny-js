import React from "react";
import { createComponentPlugin, makeDecoratable } from "@webiny/react-composition";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { MenuItem } from "@webiny/ui/Menu";
import { ReactComponent as PreviewIcon } from "~/admin/assets/visibility.svg";
import { usePage } from "~/pageEditor/hooks/usePage";
import { PageOptionsMenu } from "~/pageEditor";
import { usePreviewPage } from "~/admin/hooks/usePreviewPage";

export const PreviewPage = makeDecoratable("PreviewPage", () => {
    const [page] = usePage();
    const { previewPage } = usePreviewPage({
        id: page.id,
        status: page.status,
        path: page.path
    });

    return (
        <MenuItem onClick={previewPage} data-testid={"pb-editor-page-options-menu-preview"}>
            <ListItemGraphic>
                <Icon icon={<PreviewIcon />} />
            </ListItemGraphic>
            Preview
        </MenuItem>
    );
});

export const PreviewPageButtonPlugin = createComponentPlugin(PageOptionsMenu, Original => {
    return function PreviewPageButton({ items, ...props }) {
        return <Original {...props} items={[<PreviewPage key={"preview"} />, ...items]} />;
    };
});

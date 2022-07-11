import React from "react";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as PreviewIcon } from "~/admin/assets/visibility.svg";
import { usePage } from "~/pageEditor/hooks/usePage";
import { usePageBuilderSettings } from "~/admin/hooks/usePageBuilderSettings";
import { useSiteStatus } from "~/admin/hooks/useSiteStatus";
import { useConfigureWebsiteUrlDialog } from "~/admin/hooks/useConfigureWebsiteUrl";

const openTarget = window.Cypress ? "_self" : "_blank";

export const PreviewPageButton: React.FC = () => {
    const [page] = usePage();
    const { getPageUrl, getWebsiteUrl } = usePageBuilderSettings();
    const [isSiteRunning, refreshSiteStatus] = useSiteStatus(getWebsiteUrl());

    const { showConfigureWebsiteUrlDialog } = useConfigureWebsiteUrlDialog(
        getWebsiteUrl(),
        refreshSiteStatus
    );

    const pageData = {
        id: page.id,
        status: page.status,
        path: page.path
    };

    return (
        <MenuItem
            onClick={() => {
                if (isSiteRunning) {
                    window.open(getPageUrl(pageData, true), openTarget, "noopener");
                } else {
                    showConfigureWebsiteUrlDialog();
                }
            }}
            data-testid={"pb-editor-page-options-menu-preview"}
        >
            <ListItemGraphic>
                <Icon icon={<PreviewIcon />} />
            </ListItemGraphic>
            Preview
        </MenuItem>
    );
};

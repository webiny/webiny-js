import React from "react";
import { ReactComponent as PreviewIcon } from "~/admin/assets/visibility.svg";
import { usePage } from "~/pageEditor/hooks/usePage";
import { usePageBuilderSettings } from "~/admin/hooks/usePageBuilderSettings";
import { useSiteStatus } from "~/admin/hooks/useSiteStatus";
import { useConfigureWebsiteUrlDialog } from "~/admin/hooks/useConfigureWebsiteUrl";
import { createComponentPlugin } from "@webiny/react-composition";
import { PageOptionsMenu, PageOptionsMenuItem } from "~/pageEditor";

const openTarget = window.Cypress ? "_self" : "_blank";

export const PreviewPageButtonPlugin = createComponentPlugin(PageOptionsMenu, Original => {
    return function PreviewPageButton({ items, ...props }) {
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

        const onClick = () => {
            if (isSiteRunning) {
                window.open(getPageUrl(pageData, true), openTarget, "noopener");
            } else {
                showConfigureWebsiteUrlDialog();
            }
        };

        const previewItem: PageOptionsMenuItem = {
            label: "Preview",
            icon: <PreviewIcon />,
            onClick,
            "data-testid": "pb-editor-page-options-menu-preview"
        };
        return <Original {...props} items={[previewItem, ...items]} />;
    };
});

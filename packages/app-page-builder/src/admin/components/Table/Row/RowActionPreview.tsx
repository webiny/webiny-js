import React, { useCallback } from "react";
import { PbPageData } from "~/types";
import { useSiteStatus } from "~/admin/hooks/useSiteStatus";
import { useConfigureWebsiteUrlDialog } from "~/admin/hooks/useConfigureWebsiteUrl";
import { usePageBuilderSettings } from "~/admin/hooks/usePageBuilderSettings";
import { MenuItem } from "@webiny/ui/Menu";

interface RowActionPreviewPageProps {
    page: PbPageData;
}

const RowActionPreviewPage: React.FC<RowActionPreviewPageProps> = props => {
    const { page } = props;
    const { getPageUrl, getWebsiteUrl } = usePageBuilderSettings();

    const [isSiteRunning, refreshSiteStatus] = useSiteStatus(getWebsiteUrl());
    const { showConfigureWebsiteUrlDialog } = useConfigureWebsiteUrlDialog(
        getWebsiteUrl(),
        refreshSiteStatus
    );

    // We must prevent opening in new tab - Cypress doesn't work with new tabs.
    const target = "Cypress" in window ? "_self" : "_blank";
    const url = getPageUrl(page, !page.locked);

    const handlePreviewClick = useCallback(() => {
        if (isSiteRunning) {
            window.open(url, target, "noopener");
        } else {
            showConfigureWebsiteUrlDialog();
        }
    }, [url, isSiteRunning]);

    const previewButtonLabel = page.locked ? "View" : "Preview";

    return <MenuItem onClick={handlePreviewClick}>{previewButtonLabel}</MenuItem>;
};

export default RowActionPreviewPage;

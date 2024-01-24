import { useCallback } from "react";
import { usePageBuilderSettings } from "~/admin/hooks/usePageBuilderSettings";
import { useSiteStatus } from "~/admin/hooks/useSiteStatus";
import { useConfigureWebsiteUrlDialog } from "~/admin/hooks/useConfigureWebsiteUrl";
import { PbPageTableItem } from "~/types";

interface UsePreviewPageParams {
    page: PbPageTableItem;
}

export const usePreviewPage = ({ page }: UsePreviewPageParams) => {
    const { getPageUrl, getWebsiteUrl } = usePageBuilderSettings();
    const [isSiteRunning, refreshSiteStatus] = useSiteStatus(getWebsiteUrl());

    const { showConfigureWebsiteUrlDialog } = useConfigureWebsiteUrlDialog(
        getWebsiteUrl(),
        refreshSiteStatus
    );

    // We must prevent opening in new tab - Cypress doesn't work with new tabs.
    const target = "Cypress" in window ? "_self" : "_blank";

    const url = getPageUrl(page.data);

    const previewPage = useCallback(() => {
        if (isSiteRunning) {
            window.open(url, target, "noopener");
        } else {
            showConfigureWebsiteUrlDialog();
        }
    }, [url, isSiteRunning]);

    return {
        previewPage
    };
};

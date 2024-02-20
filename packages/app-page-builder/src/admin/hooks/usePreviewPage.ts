import { useCallback } from "react";
import { usePageBuilderSettings } from "~/admin/hooks/usePageBuilderSettings";
import { useSiteStatus } from "~/admin/hooks/useSiteStatus";
import { useConfigureWebsiteUrlDialog } from "~/admin/hooks/useConfigureWebsiteUrl";
import { PbPageData } from "~/types";

/**
 * This hook handles the logic of loading website preview URL, verifying that it exists, checking that the preview URL
 * is accessible, and if not, shows a dialog to the user to either configure or ensure the endpoint is accessible.
 */
export function usePreviewPage(input: Pick<PbPageData, "id" | "status" | "path">) {
    const { getPageUrl, getWebsiteUrl } = usePageBuilderSettings();
    const [isSiteRunning, refreshSiteStatus] = useSiteStatus(getWebsiteUrl());
    const { showConfigureWebsiteUrlDialog } = useConfigureWebsiteUrlDialog(
        getWebsiteUrl(),
        refreshSiteStatus
    );

    // For test environments, we must not open new tabs. Cypress doesn't work with new tabs.
    const target = "Cypress" in window ? "_self" : "_blank";
    const url = getPageUrl(input);

    const handlePreviewClick = useCallback(() => {
        if (isSiteRunning) {
            window.open(url, target, "noopener");
        } else {
            showConfigureWebsiteUrlDialog();
        }
    }, [url, isSiteRunning]);

    return { previewPage: handlePreviewClick, previewUrl: url };
}

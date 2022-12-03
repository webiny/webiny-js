import React, { ReactElement, useCallback } from "react";

import { i18n } from "@webiny/app/i18n";
import { MenuItem } from "@webiny/ui/Menu";

import { useConfigureWebsiteUrlDialog } from "~/admin/hooks/useConfigureWebsiteUrl";
import { usePageBuilderSettings } from "~/admin/hooks/usePageBuilderSettings";
import { useSiteStatus } from "~/admin/hooks/useSiteStatus";

import { PbPageData } from "~/types";

const t = i18n.ns("app-headless-cms/app-page-builder/pages-table/actions/page/preview");

interface Props {
    page: PbPageData;
}

export const PageActionPreview = ({ page }: Props): ReactElement => {
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

    const previewButtonLabel = page.locked ? t`View` : t`Preview`;

    return <MenuItem onClick={handlePreviewClick}>{previewButtonLabel}</MenuItem>;
};

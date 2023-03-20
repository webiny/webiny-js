import React, { ReactElement, useCallback } from "react";

import { ReactComponent as Visibility } from "@material-design-icons/svg/filled/visibility.svg";
import { i18n } from "@webiny/app/i18n";
import { Icon } from "@webiny/ui/Icon";
import { MenuItem } from "@webiny/ui/Menu";

import { useConfigureWebsiteUrlDialog } from "~/admin/hooks/useConfigureWebsiteUrl";
import { usePageBuilderSettings } from "~/admin/hooks/usePageBuilderSettings";
import { useSiteStatus } from "~/admin/hooks/useSiteStatus";

import { ListItemGraphic } from "~/admin/components/Table/Table/styled";
import { PbPageDataItem } from "~/types";

const t = i18n.ns("app-headless-cms/app-page-builder/pages-table/actions/page/preview");

interface Props {
    record: PbPageDataItem;
}

export const RecordActionPreview = ({ record }: Props): ReactElement => {
    const { getPageUrl, getWebsiteUrl } = usePageBuilderSettings();

    const [isSiteRunning, refreshSiteStatus] = useSiteStatus(getWebsiteUrl());
    const { showConfigureWebsiteUrlDialog } = useConfigureWebsiteUrlDialog(
        getWebsiteUrl(),
        refreshSiteStatus
    );

    // We must prevent opening in new tab - Cypress doesn't work with new tabs.
    const target = "Cypress" in window ? "_self" : "_blank";

    const url = getPageUrl(record);

    const handlePreviewClick = useCallback(() => {
        if (isSiteRunning) {
            window.open(url, target, "noopener");
        } else {
            showConfigureWebsiteUrlDialog();
        }
    }, [url, isSiteRunning]);

    const previewButtonLabel = record.status === "published" ? t`View` : t`Preview`;

    return (
        <MenuItem onClick={handlePreviewClick}>
            <ListItemGraphic>
                <Icon icon={<Visibility />} />
            </ListItemGraphic>
            {previewButtonLabel}
        </MenuItem>
    );
};

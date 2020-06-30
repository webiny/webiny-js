import React from "react";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { omit, isEqual } from "lodash";
import { getPage } from "@webiny/app-page-builder/editor/selectors";
import { MenuItem } from "@webiny/ui/Menu";
import { useConfigureDomainDialog } from "@webiny/app-page-builder/admin/hooks/useConfigureDomain";
import { usePageBuilderSettings } from "@webiny/app-page-builder/admin/hooks/usePageBuilderSettings";
import { useSiteStatus } from "@webiny/app-page-builder/admin/hooks/useSiteStatus";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as PreviewIcon } from "@webiny/app-page-builder/admin/assets/visibility.svg";

const openTarget = window.Cypress ? "_self" : "_blank";

const PreviewPageButton = ({ page }) => {
    const { getPagePreviewUrl, getDomain } = usePageBuilderSettings();
    const [isSiteRunning, refreshSiteStatus] = useSiteStatus(getDomain());

    const { showConfigureDomainDialog } = useConfigureDomainDialog(getDomain(), refreshSiteStatus);

    return (
        <MenuItem
            onClick={() => {
                if (isSiteRunning) {
                    window.open(getPagePreviewUrl(page), openTarget, "noopener");
                } else {
                    showConfigureDomainDialog();
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

export default connect<any, any, any>(
    state => ({ page: omit(getPage(state), ["content"]) }),
    null,
    null,
    { areStatePropsEqual: isEqual }
)(PreviewPageButton);

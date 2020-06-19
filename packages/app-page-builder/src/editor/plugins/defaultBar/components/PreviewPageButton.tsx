import React from "react";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { omit, isEqual } from "lodash";
import { getPage } from "@webiny/app-page-builder/editor/selectors";
import { MenuItem } from "@webiny/ui/Menu";
import { usePageBuilderSettings } from "@webiny/app-page-builder/admin/hooks/usePageBuilderSettings";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { ReactComponent as PreviewIcon } from "@webiny/app-page-builder/admin/assets/visibility.svg";
import {
    ConfigureDomainMessage,
    configureDomainTitle
} from "@webiny/app-page-builder/utils/configureDomain";

const openTarget = window.Cypress ? "_self" : "_blank";

const PreviewPageButton = ({ page }) => {
    const { getPagePreviewUrl, getDomain, isSiteRunning } = usePageBuilderSettings();

    return (
        <ConfirmationDialog
            title={configureDomainTitle}
            message={<ConfigureDomainMessage domain={getDomain()} />}
        >
            {({ showConfirmation }) => {
                return (
                    <MenuItem
                        onClick={() => {
                            if (isSiteRunning) {
                                window.open(getPagePreviewUrl(page), openTarget);
                            } else {
                                showConfirmation();
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
            }}
        </ConfirmationDialog>
    );
};

export default connect<any, any, any>(
    state => ({ page: omit(getPage(state), ["content"]) }),
    null,
    null,
    { areStatePropsEqual: isEqual }
)(PreviewPageButton);

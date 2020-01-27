import React from "react";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { getPage } from "@webiny/app-page-builder/editor/selectors";
import { omit, isEqual } from "lodash";
import { withRouter } from "@webiny/react-router";
import { MenuItem } from "@webiny/ui/Menu";
import { usePageBuilderSettings } from "@webiny/app-page-builder/admin/hooks/usePageBuilderSettings";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as PreviewIcon } from "@webiny/app-page-builder/admin/assets/visibility.svg";

const PreviewPageButton = ({ page }) => {
    const { getPagePreviewUrl } = usePageBuilderSettings();
    return (
        <MenuItem onClick={() => window.open(getPagePreviewUrl(page), "_blank")}>
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
)(withRouter(PreviewPageButton));

// @flow
import React from "react";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { getPage } from "@webiny/app-page-builder/editor/selectors";
import { omit, isEqual } from "lodash";
import { withRouter } from "react-router-dom";
import { MenuItem } from "@webiny/ui/Menu";
import { usePageBuilderSettings } from "@webiny/app-page-builder/admin/hooks/usePageBuilderSettings";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as PreviewIcon } from "@webiny/app-page-builder/admin/assets/visibility.svg";

const PreviewPageButton = ({ page }: Object) => {
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

export default connect(
    state => ({ page: omit(getPage(state), ["content"]) }),
    null,
    null,
    { areStatePropsEqual: isEqual }
)(withRouter(PreviewPageButton));

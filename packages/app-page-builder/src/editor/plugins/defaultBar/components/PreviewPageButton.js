// @flow
import React from "react";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { getPage } from "@webiny/app-page-builder/editor/selectors";
import { compose } from "recompose";
import { omit, isEqual } from "lodash";
import { withSnackbar } from "@webiny/app-admin/components";
import { withRouter } from "react-router-dom";
import { MenuItem } from "@webiny/ui/Menu";
import { withPageBuilderSettings } from "@webiny/app-page-builder/admin/components";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as PreviewIcon } from "@webiny/app-page-builder/admin/assets/visibility.svg";

const PreviewPageButton = ({ page, pageBuilderSettings: { getPagePreviewUrl } }: Object) => {
    return (
        <MenuItem onClick={() => window.open(getPagePreviewUrl(page), "_blank")}>
            <ListItemGraphic>
                <Icon icon={<PreviewIcon />} />
            </ListItemGraphic>
            Preview
        </MenuItem>
    );
};

export default compose(
    connect(
        state => ({ page: omit(getPage(state), ["content"]) }),
        null,
        null,
        { areStatePropsEqual: isEqual }
    ),
    withSnackbar(),
    withRouter,
    withPageBuilderSettings()
)(PreviewPageButton);

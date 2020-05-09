import React from "react";
import { css } from "emotion";
import { renderPlugins } from "@webiny/app/plugins";
import { Typography } from "@webiny/ui/Typography";
import { Grid, Cell } from "@webiny/ui/Grid";
import { I18NValue } from "@webiny/app-i18n/components";
import { i18n } from "@webiny/app/i18n";
import classNames from "classnames";
const t = i18n.ns("app-headless-cms/admin/plugins/content-details-header/header");

const titleGrid = css({
    paddingBottom: "0 !important"
});

const toolbarGrid = css({
    paddingTop: "0 !important",
    borderBottom: "1px solid var(--mdc-theme-on-background)"
});

const contentTitle = css({
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
});

const headerActions = css({
    display: "flex",
    alignItems: "center"
});

const headerActionsLeft = css({
    justifyContent: "flex-end"
});

const headerActionsRight = css({
    justifyContent: "flex-start"
});

const Header = props => {
    const { contentModel, content } = props;

    let title;
    if (contentModel) {
        title = t`New {contentModelName}`({ contentModelName: contentModel.name });
    }

    if (content.id) {
        title = I18NValue({ value: content.meta.title });
    }

    return (
        <React.Fragment>
            <Grid className={titleGrid}>
                <Cell span={12} className={contentTitle}>
                    <Typography use="headline5">{title}</Typography>
                </Cell>
            </Grid>
            <Grid className={toolbarGrid}>
                <Cell span={6} className={classNames(headerActions, headerActionsRight)}>
                    {renderPlugins("cms-content-details-header-left", props)}
                </Cell>
                <Cell span={6} className={classNames(headerActions, headerActionsLeft)}>
                    {renderPlugins("cms-content-details-header-right", props)}
                </Cell>
            </Grid>
        </React.Fragment>
    );
};

export default Header;

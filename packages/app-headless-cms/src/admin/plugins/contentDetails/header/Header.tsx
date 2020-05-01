import React from "react";
import { css } from "emotion";
import { renderPlugins } from "@webiny/app/plugins";
import { Typography } from "@webiny/ui/Typography";
import { Grid, Cell } from "@webiny/ui/Grid";
import { I18NValue } from "@webiny/app-i18n/components";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/plugins/content-details-header/header");

const headerTitle = css({
    "&.mdc-layout-grid": {
        borderBottom: "1px solid var(--mdc-theme-on-background)",
        color: "var(--mdc-theme-text-primary-on-background)",
        background: "var(--mdc-theme-surface)",
        paddingTop: 10,
        paddingBottom: 9,
        ".mdc-layout-grid__inner": {
            alignItems: "center"
        }
    }
});

const pageTitle = css({
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
});

const headerActions = css({
    justifyContent: "flex-end",
    marginRight: "-15px",
    display: "flex",
    alignItems: "center"
});

const Header = props => {
    const { contentModel, content } = props;

    let formTitle;
    if (contentModel) {
        formTitle = t`New {contentModelTitle}`({ contentModelTitle: contentModel.title });
    }

    if (content.id) {
        formTitle = I18NValue({ value: content.meta.title });
    }

    return (
        <React.Fragment>
            <Grid className={headerTitle}>
                <Cell span={8} className={pageTitle}>
                    <Typography use="headline5">
                        {formTitle}
                    </Typography>
                </Cell>
                <Cell span={4} className={headerActions}>
                    {renderPlugins("cms-content-details-header-left", props)}
                    {renderPlugins("cms-content-details-header-right", props)}
                </Cell>
            </Grid>
        </React.Fragment>
    );
};

export default Header;

import React from "react";
import { css } from "emotion";
import { Typography } from "@webiny/ui/Typography";
import { Grid, Cell } from "@webiny/ui/Grid";
import {
    PublishRevision,
    DeleteRevision,
    EditRevision,
    RevisionSelector
} from "./HeaderComponents";
import { FbFormDetailsPluginRenderParams, FbRevisionModel } from "~/types";

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

interface HeaderProps extends FbFormDetailsPluginRenderParams {
    revision: FbRevisionModel;
    selectRevision: (revision: FbRevisionModel) => void;
}

const Header: React.FC<HeaderProps> = props => {
    const { revision } = props;
    return (
        <React.Fragment>
            {revision && (
                <Grid className={headerTitle}>
                    <Cell span={8} className={pageTitle}>
                        <Typography use="headline5">{revision.name}</Typography>
                    </Cell>
                    <Cell span={4} className={headerActions}>
                        <RevisionSelector {...props} />
                        <EditRevision {...props} />
                        <PublishRevision {...props} />
                        <DeleteRevision {...props} />
                    </Cell>
                </Grid>
            )}
        </React.Fragment>
    );
};

export default Header;

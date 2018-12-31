//@flow
import * as React from "react";
import classSet from "classnames";
import { Cell, Grid, GridInner, type Props } from "webiny-ui/Grid";
import { css } from "emotion";
import styled from "react-emotion";

const grid = css({
    "&.mdc-layout-grid": {
        padding: 0,
        backgroundColor: "var(--mdc-theme-background)"
    }
});

const gridInner = css({
    "&.mdc-layout-grid__inner": {
        gridGap: 0
    }
});

const RightPanelWrapper = styled("div")({
    //padding: 25,
    backgroundColor: "var(--mdc-theme-background)",
    overflow: "scroll",
    height: "calc(100vh - 70px)"
});

const leftPanel = css({
    backgroundColor: "var(--mdc-theme-surface)",
    ">.webiny-data-list": {
        display: "flex",
        flexDirection: "column",
        maxHeight: "calc(100vh - 70px)",
        ".mdc-list": {
            height: "100%",
            overflow: "scroll"
        }
    },
    ">.mdc-list": {
        display: "flex",
        flexDirection: "column",
        maxHeight: "calc(100vh - 70px)",
        overflow: "scroll"
    }
});

const CompactView = (props: {
    children: React.ChildrenArray<React.Element<typeof LeftPanel | typeof RightPanel | *>>
}) => {
    return (
        <Grid className={grid}>
            <GridInner className={gridInner}>{props.children}</GridInner>
        </Grid>
    );
};

const LeftPanel = (props: Props) => {
    return (
        <Cell className={classSet(leftPanel, props.className)} span={props.span ? props.span : 5}>
            {props.children}
        </Cell>
    );
};

const RightPanel = (props: Props) => {
    const { children, ...rest } = props;
    return (
        <Cell span={props.span ? props.span : 7} {...rest}>
            <RightPanelWrapper>{children}</RightPanelWrapper>
        </Cell>
    );
};

export { CompactView, LeftPanel, RightPanel };

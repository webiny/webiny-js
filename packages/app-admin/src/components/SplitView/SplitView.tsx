import * as React from "react";
import classSet from "classnames";
import { Cell, Grid, GridInner, CellProps } from "@webiny/ui/Grid";
import { css } from "emotion";
import styled from "@emotion/styled";
import { clone } from "lodash";
import { getClasses } from "@webiny/ui/Helpers";

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

type SplitViewProps = {
    children: React.ReactElement<any>[];
    className?: string;
};

const SplitView = (props: SplitViewProps) => {
    return (
        <Grid className={classSet(grid, props.className, "webiny-split-view")}>
            <GridInner className={gridInner + " webiny-split-view__inner"}>
                {props.children}
            </GridInner>
        </Grid>
    );
};

const LeftPanel = (props: CellProps) => {
    const propList = clone(props);
    if (!propList.hasOwnProperty("span")) {
        propList.span = 5;
    }

    return (
        <Cell
            {...getClasses(
                propList,
                classSet(leftPanel, props.className, "webiny-split-view__left-panel")
            )}
        >
            {propList.children}
        </Cell>
    );
};

const RightPanel = (props: CellProps) => {
    const propList = clone(props);
    if (!propList.hasOwnProperty("span")) {
        propList.span = 7;
    }

    return (
        <Cell {...getClasses(propList, "webiny-split-view__right-panel")}>
            <RightPanelWrapper
                className={"webiny-split-view__right-panel-wrapper"}
                id={"webiny-split-view-right-panel"}
            >
                {propList.children}
            </RightPanelWrapper>
        </Cell>
    );
};

export { SplitView, LeftPanel, RightPanel };

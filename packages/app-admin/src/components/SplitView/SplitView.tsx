import * as React from "react";
import classSet from "classnames";
import { CellProps } from "@webiny/ui/Grid";
import { css } from "emotion";
import styled from "@emotion/styled";
import { getClasses } from "@webiny/ui/Helpers";
import {
    Panel,
    PanelProps,
    PanelGroup,
    PanelResizeHandle,
    PanelGroupProps
} from "~/components/ResizablePanels";

const grid = css({
    "&.mdc-layout-grid": {
        padding: 0,
        margin: "-3px auto 0 auto",
        backgroundColor: "var(--mdc-theme-background)",
        ">.mdc-layout-grid__inner": {
            gridGap: 0
        }
    }
});

const RightPanelWrapper = styled("div")({
    backgroundColor: "var(--mdc-theme-background)",
    overflow: "auto",
    height: "calc(100vh - 64px)"
});

export const leftPanel = css({
    backgroundColor: "var(--mdc-theme-surface)",
    ">.webiny-data-list": {
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 70px)",
        ".mdc-deprecated-list": {
            overflow: "auto"
        }
    },
    ">.mdc-deprecated-list": {
        display: "flex",
        flexDirection: "column",
        maxHeight: "calc(100vh - 64px)",
        overflow: "auto"
    }
});

type SplitViewProps = Omit<PanelGroupProps, "direction" | "id">;

const SplitView = ({ children, className, ...props }: SplitViewProps) => {
    return (
        <PanelGroup
            direction="horizontal"
            id="splitView"
            className={classSet(grid, className, "webiny-split-view")}
            {...props}
        >
            {children}
        </PanelGroup>
    );
};

// Get the default size for the panel:
const getDefaultSize = (span = 6) => {
    return (span / 12) * 100;
};

interface SplitViewPanelProps extends Omit<CellProps, "style">, Omit<PanelProps, "id"> {}

const LeftPanel = ({ children, className, ...props }: SplitViewPanelProps) => {
    const defaultSize = props.defaultSize ?? getDefaultSize(props.span || 5);

    return (
        <>
            <Panel
                defaultSize={defaultSize}
                minSize={10}
                id="leftPanel"
                {...getClasses(
                    props,
                    classSet(leftPanel, className, "webiny-split-view__left-panel")
                )}
                {...props}
            >
                {children}
            </Panel>
            <PanelResizeHandle />
        </>
    );
};

const RightPanel = ({ children, ...props }: SplitViewPanelProps) => {
    const defaultSize = props.defaultSize ?? getDefaultSize(props.span || 7);

    return (
        <Panel
            defaultSize={defaultSize}
            minSize={30}
            id="rightPanel"
            {...getClasses(props, "webiny-split-view__right-panel")}
            {...props}
        >
            <RightPanelWrapper
                className={"webiny-split-view__right-panel-wrapper"}
                id={"webiny-split-view-right-panel"}
            >
                {children}
            </RightPanelWrapper>
        </Panel>
    );
};

// Utility function to generate the autoSaveId
const generateAutoSaveId = (
    tenantId: string | null,
    localeCode: string | null,
    applicationId: string
) => {
    if (!tenantId || !localeCode || !applicationId) {
        return null;
    }
    return `T#${tenantId}#L#${localeCode}#A#${applicationId}`;
};

export { SplitView, LeftPanel, RightPanel, generateAutoSaveId };

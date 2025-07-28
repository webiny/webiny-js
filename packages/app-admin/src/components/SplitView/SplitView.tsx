import * as React from "react";
import { cn, Separator, ColumnProps } from "@webiny/admin-ui";
import {
    Panel,
    PanelProps,
    PanelGroup,
    PanelResizeHandle,
    PanelGroupProps
} from "~/components/ResizablePanels";

interface SplitViewProps extends Omit<PanelGroupProps, "direction" | "id" | "autoSaveId"> {
    layoutId?: string | null;
}

const SplitView = ({ children, className, layoutId, ...props }: SplitViewProps) => {
    return (
        <PanelGroup
            direction="horizontal"
            id="splitView"
            autoSaveId={layoutId}
            className={cn("webiny-split-view", className)}
            {...props}
        >
            {children}
        </PanelGroup>
    );
};

// Get the default size for the panel:
const getDefaultSize = (span: ColumnProps["span"]) => {
    const spanValue = typeof span === "number" && span > 0 && span <= 12 ? span : 6;
    return (spanValue / 12) * 100;
};

interface SplitViewPanelProps extends Omit<PanelProps, "id"> {
    span?: ColumnProps["span"];
}

const LeftPanel = ({ children, className, ...props }: SplitViewPanelProps) => {
    const defaultSize = props.defaultSize ?? getDefaultSize(props.span || 5);

    return (
        <>
            <Panel
                defaultSize={defaultSize}
                minSize={10}
                id="leftPanel"
                className={cn("webiny-split-view__right-panel", className)}
                {...props}
            >
                {children}
            </Panel>
            <PanelResizeHandle>
                <Separator orientation={"vertical"} />
            </PanelResizeHandle>
        </>
    );
};

const RightPanel = ({ children, className, ...props }: SplitViewPanelProps) => {
    const defaultSize = props.defaultSize ?? getDefaultSize(props.span || 7);

    return (
        <Panel
            defaultSize={defaultSize}
            minSize={30}
            id="rightPanel"
            className={cn("webiny-split-view__right-panel", className)}
            {...props}
            style={{ overflowY: "scroll" }}
        >
            {children}
        </Panel>
    );
};

export { SplitView, LeftPanel, RightPanel };

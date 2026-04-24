import * as React from "react";
import type { ColumnProps } from "@webiny/admin-ui";
import { cn, Separator } from "@webiny/admin-ui";
import type { PanelProps, PanelGroupProps } from "~/components/ResizablePanels/index.js";
import {
    Panel,
    PanelGroup,
    PanelResizeHandle,
    type Layout
} from "~/components/ResizablePanels/index.js";
import { useLocalStorage, useLocalStorageValue } from "@webiny/app";
import { useCallback } from "react";

interface SplitViewProps extends Omit<PanelGroupProps, "id"> {
    namespace?: string;
}

export const SplitView = ({
    children,
    className,
    namespace = "splitView",
    ...props
}: SplitViewProps) => {
    const localStorage = useLocalStorage();

    const layout = useLocalStorageValue<Layout>(namespace);

    const saveLayout = useCallback(
        (layout: Layout) => {
            localStorage.set(`${namespace}/panels`, layout);
        },
        [localStorage, namespace]
    );

    return (
        <PanelGroup
            id={namespace}
            defaultLayout={layout}
            className={cn("webiny-split-view", className)}
            onLayoutChanged={saveLayout}
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

export const LeftPanel = ({ children, className, ...props }: SplitViewPanelProps) => {
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
            <PanelResizeHandle className={"outline-0"}>
                <Separator orientation={"vertical"} />
            </PanelResizeHandle>
        </>
    );
};

export const RightPanel = ({ children, className, ...props }: SplitViewPanelProps) => {
    const defaultSize = props.defaultSize ?? getDefaultSize(props.span || 7);

    return (
        <Panel
            defaultSize={defaultSize}
            minSize={30}
            id="rightPanel"
            className={cn("overflow-scroll! webiny-split-view__right-panel", className)}
            {...props}
            style={{ overflowY: "scroll" }}
        >
            {children}
        </Panel>
    );
};

import * as React from "react";
import { CellProps } from "@webiny/ui/Grid";
declare type SplitViewProps = {
    children: React.ReactElement<any>[];
    className?: string;
};
declare const SplitView: (props: SplitViewProps) => JSX.Element;
declare const LeftPanel: (props: CellProps) => JSX.Element;
declare const RightPanel: (props: CellProps) => JSX.Element;
export { SplitView, LeftPanel, RightPanel };

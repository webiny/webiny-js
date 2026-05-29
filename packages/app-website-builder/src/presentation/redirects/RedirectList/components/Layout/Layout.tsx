import React from "react";
import { LeftPanel, RightPanel, SplitView } from "@webiny/app-admin";

export interface LayoutProps {
    main: React.ReactNode;
    sidebar: React.ReactNode;
}

export const Layout = (props: LayoutProps) => {
    return (
        <SplitView namespace={"wb/redirect/list"}>
            <LeftPanel span={2}>{props.sidebar}</LeftPanel>
            <RightPanel span={10}>{props.main}</RightPanel>
        </SplitView>
    );
};

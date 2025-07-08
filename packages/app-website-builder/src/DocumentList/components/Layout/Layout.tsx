import React from "react";
import { LeftPanel, RightPanel, SplitView } from "@webiny/app-admin/components/SplitView/index.js";
import { useLayoutId } from "~/DocumentList/components/Layout/useLayoutId.js";
import { WB_PAGE_APP } from "~/constants.js";

interface LayoutProps {
    main: React.ReactNode;
    sidebar: React.ReactNode;
}

const Layout = (props: LayoutProps) => {
    const layoutId = useLayoutId(WB_PAGE_APP);

    return (
        <SplitView layoutId={layoutId}>
            <LeftPanel span={2}>{props.sidebar}</LeftPanel>
            <RightPanel span={10}>{props.main}</RightPanel>
        </SplitView>
    );
};

export { Layout, type LayoutProps };

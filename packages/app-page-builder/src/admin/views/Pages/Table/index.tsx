import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { useRouter } from "@webiny/react-router";

import { Accessories } from "~/admin/views/Pages/Table/Accessories";
import { List } from "~/admin/views/Pages/Table/List";

const Index: React.FC = () => {
    const { location } = useRouter();
    const query = new URLSearchParams(location.search);
    const currentFolderId = query.get("folderId") || undefined;

    return (
        <SplitView>
            <LeftPanel span={3}>
                <Accessories currentFolderId={currentFolderId} />
            </LeftPanel>
            <RightPanel span={9}>
                <List currentFolderId={currentFolderId} />
            </RightPanel>
        </SplitView>
    );
};

export default Index;

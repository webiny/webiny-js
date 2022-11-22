import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { useRouter } from "@webiny/react-router";

import { Sidebar } from "~/admin/views/Pages/Table/Sidebar";
import { Main } from "~/admin/views/Pages/Table/Main";

const Index: React.FC = () => {
    const { location } = useRouter();
    const query = new URLSearchParams(location.search);
    const currentFolderId = query.get("folderId") || undefined;

    return (
        <SplitView>
            <LeftPanel span={3}>
                <Sidebar folderId={currentFolderId} />
            </LeftPanel>
            <RightPanel span={9}>
                <Main folderId={currentFolderId} />
            </RightPanel>
        </SplitView>
    );
};

export default Index;

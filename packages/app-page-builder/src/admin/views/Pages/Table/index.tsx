import React, { useEffect } from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";

import { Sidebar } from "~/admin/views/Pages/Table/Sidebar";
import { Main } from "~/admin/views/Pages/Table/Main";
import { usePageViewNavigation } from "~/hooks/usePageViewNavigation";

const Index: React.FC = () => {
    const { currentFolderId, setFolderIdToStorage } = usePageViewNavigation();

    useEffect(() => {
        setFolderIdToStorage(currentFolderId);
    }, [currentFolderId]);

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

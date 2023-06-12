import React, { useEffect } from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { i18n } from "@webiny/app/i18n";

import { Sidebar } from "~/admin/views/Pages/Table/Sidebar";
import { Main } from "~/admin/views/Pages/Table/Main";
import { usePageViewNavigation } from "~/hooks/usePageViewNavigation";

const t = i18n.ns("app-page-builder/admin/views/pages/table");

const Index: React.FC = () => {
    const { currentFolderId, setFolderIdToStorage } = usePageViewNavigation();

    useEffect(() => {
        setFolderIdToStorage(currentFolderId);
    }, [currentFolderId]);

    const defaultFolderName = t`All pages`;

    return (
        <SplitView>
            <LeftPanel span={2}>
                <Sidebar folderId={currentFolderId} defaultFolderName={defaultFolderName} />
            </LeftPanel>
            <RightPanel span={10}>
                <Main folderId={currentFolderId} defaultFolderName={defaultFolderName} />
            </RightPanel>
        </SplitView>
    );
};

export default Index;

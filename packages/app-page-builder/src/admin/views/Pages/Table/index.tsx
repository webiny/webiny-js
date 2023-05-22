import React, { useEffect } from "react";
import { LeftPanel, RightPanel, SplitView } from "@webiny/app-admin/components/SplitView";
import { i18n } from "@webiny/app/i18n";
import { Sidebar } from "~/admin/views/Pages/Table/Sidebar";
import { Main } from "~/admin/views/Pages/Table/Main";
import { usePageViewNavigation } from "~/hooks/usePageViewNavigation";
import { FOLDER_ID_DEFAULT, PB_APP_TYPE } from "~/admin/constants";
import { AcoProvider } from "@webiny/app-aco";

const t = i18n.ns("app-page-builder/admin/views/pages/table");

const Index: React.FC = () => {
    const { currentFolderId, setFolderIdToStorage } = usePageViewNavigation();

    useEffect(() => {
        setFolderIdToStorage(currentFolderId);
    }, [currentFolderId]);

    const defaultFolderName = t`All pages`;

    return (
        <AcoProvider id={PB_APP_TYPE}>
            <SplitView>
                <LeftPanel span={2}>
                    <Sidebar folderId={currentFolderId} defaultFolderName={defaultFolderName} />
                </LeftPanel>
                <RightPanel span={10}>
                    <Main
                        folderId={currentFolderId || FOLDER_ID_DEFAULT}
                        defaultFolderName={defaultFolderName}
                    />
                </RightPanel>
            </SplitView>
        </AcoProvider>
    );
};

export default Index;

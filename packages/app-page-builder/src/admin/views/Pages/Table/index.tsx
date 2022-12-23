import React from "react";
import { i18n } from "@webiny/app/i18n";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { useRouter } from "@webiny/react-router";

import { Sidebar } from "~/admin/views/Pages/Table/Sidebar";
import { Main } from "~/admin/views/Pages/Table/Main";

const t = i18n.ns("app-page-builder/admin/views/pages/table");

const Index: React.FC = () => {
    const { location } = useRouter();
    const query = new URLSearchParams(location.search);
    const currentFolderId = query.get("folderId") || undefined;
    const defaultFolderName = t`All pages`;

    return (
        <SplitView>
            <LeftPanel span={3}>
                <Sidebar folderId={currentFolderId} defaultFolderName={defaultFolderName} />
            </LeftPanel>
            <RightPanel span={9}>
                <Main folderId={currentFolderId} defaultFolderName={defaultFolderName} />
            </RightPanel>
        </SplitView>
    );
};

export default Index;

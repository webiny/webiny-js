import React, { useCallback } from "react";
import { LeftPanel, RightPanel, SplitView } from "@webiny/app-admin/components/SplitView";
import { Sidebar } from "./Sidebar";
import { Main } from "./Main";
import {
    LOCAL_STORAGE_LATEST_VISITED_FOLDER,
    PAGE_BUILDER_LIST_LINK,
    PB_APP_TYPE
} from "~/admin/constants";
import { AcoProvider, useNavigateFolder } from "@webiny/app-aco";
import { useApolloClient } from "@apollo/react-hooks";

const View: React.VFC = () => {
    const { currentFolderId } = useNavigateFolder();

    return (
        <SplitView>
            <LeftPanel span={2}>
                <Sidebar folderId={currentFolderId} />
            </LeftPanel>
            <RightPanel span={10}>
                <Main folderId={currentFolderId} />
            </RightPanel>
        </SplitView>
    );
};

const Index: React.VFC = () => {
    const client = useApolloClient();

    const createNavigateFolderListLink = useCallback(() => {
        return PAGE_BUILDER_LIST_LINK;
    }, []);
    const createNavigateFolderStorageKey = useCallback(() => {
        return LOCAL_STORAGE_LATEST_VISITED_FOLDER;
    }, []);

    return (
        <AcoProvider
            id={PB_APP_TYPE}
            client={client}
            createNavigateFolderListLink={createNavigateFolderListLink}
            createNavigateFolderStorageKey={createNavigateFolderStorageKey}
        >
            <View />
        </AcoProvider>
    );
};

export default Index;

import React, { memo } from "react";
import { AddRoute, Layout, Plugins, AddMenu, createProviderPlugin } from "@webiny/app-admin";
import { FoldersProvider as ContextProvider } from "./contexts/Folders";
import { FolderTree } from "~/components/Tree";

const FoldersProviderHOC = createProviderPlugin(Component => {
    return function FoldersProvider({ children }) {
        return (
            <ContextProvider>
                <Component>{children}</Component>
            </ContextProvider>
        );
    };
});

const FoldersExtension: React.FC = () => {
    return (
        <>
            <FoldersProviderHOC />
            <Plugins>
                <AddRoute path={"/folders/list"}>
                    <Layout title={"Folders - List"}>
                        <FolderTree
                            type={"page"}
                            focusedFolderId={"631f3285d878490009edd720"}
                            onFolderClick={data => console.log("Page data", data)}
                        />
                        <FolderTree
                            type={"cms"}
                            onFolderClick={data => console.log("CMS data", data)}
                        />
                    </Layout>
                </AddRoute>
                <AddMenu name={"settings"}>
                    <AddMenu name={"settings.folders"} label={"Folders"}>
                        <AddMenu
                            name={"settings.folders.list"}
                            label={"List"}
                            path={"/folders/list"}
                        />
                    </AddMenu>
                </AddMenu>
            </Plugins>
        </>
    );
};

export const Folders = memo(FoldersExtension);

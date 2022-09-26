import React, { memo } from "react";
import { AddRoute, Layout, Provider, Plugins, AddMenu } from "@webiny/app-admin";
import { FoldersProvider as ContextProvider } from "./contexts/Folders";
import { FolderTree } from "~/admin/Tree";

const FoldersProviderHOC = (Component: React.FC): React.FC => {
    return function FoldersProvider({ children }) {
        return (
            <ContextProvider>
                <Component>{children}</Component>
            </ContextProvider>
        );
    };
};

const FoldersExtension: React.FC = () => {
    //plugins.register(i18nPlugins());

    /**
     * TODO @ts-refactor
     * Provider.hoc expects ComponentType.
     */
    return (
        <>
            <Provider hoc={FoldersProviderHOC} />
            <Plugins>
                <AddRoute path={"/folders/list"}>
                    <Layout title={"Folders - List"}>
                        <FolderTree type={"page"} focusedNodeId={"631f3285d878490009edd720"} />
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

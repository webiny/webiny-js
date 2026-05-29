import React from "react";
import { FolderTree } from "@webiny/app-aco/presentation/folderTree/FolderTree.js";
import { observer } from "mobx-react-lite";
import { useRedirectListPresenter } from "~/presentation/redirects/RedirectList/RedirectListPresenterProvider.js";
import { useRedirectListConfig } from "~/modules/redirects/configs/index.js";
import { Heading, Separator } from "@webiny/admin-ui";

const Sidebar = observer(() => {
    const { vm, actions } = useRedirectListPresenter();
    const { browser } = useRedirectListConfig();

    return (
        <div className={"flex flex-col h-main-content"}>
            <div className={"py-sm px-md"}>
                <Heading level={5}>Redirects</Heading>
            </div>
            <Separator />
            <div className={"flex-1 overflow-y-scroll"}>
                <FolderTree
                    vm={vm.folders}
                    actions={actions.folders}
                    folderActions={browser.folder.actions}
                    enableActions={true}
                    enableCreate={true}
                />
            </div>
        </div>
    );
});

export { Sidebar };

// @flow
import * as React from "react";
import { ReactComponent as LinkIcon } from "./round-folder-24px.svg";
import FolderForm from "./FolderForm";
import type { PbMenuItemPluginType } from "webiny-app-page-builder/types";

export default ({
    name: "pb-menu-item-folder",
    type: "pb-menu-item",
    menuItem: {
        type: "folder",
        title: "Folder",
        icon: <LinkIcon />,
        canHaveChildren: true,
        renderForm(props: Object) {
            return <FolderForm {...props} />;
        }
    }
}: PbMenuItemPluginType);

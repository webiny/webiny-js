import * as React from "react";
import { ReactComponent as LinkIcon } from "./round-folder-24px.svg";
import FolderForm from "./FolderForm";
import { PbMenuItemPlugin } from "@webiny/app-page-builder/admin/types";

const plugin: PbMenuItemPlugin = {
    name: "pb-menu-item-folder",
    type: "pb-menu-item",
    menuItem: {
        type: "folder",
        title: "Folder",
        icon: <LinkIcon />,
        canHaveChildren: true,
        renderForm(props) {
            return <FolderForm {...props} />;
        }
    }
};

export default plugin;

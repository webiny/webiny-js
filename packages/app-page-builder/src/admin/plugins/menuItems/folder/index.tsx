import * as React from "react";
import { ReactComponent as LinkIcon } from "./round-folder-24px.svg";
import FolderForm from "./FolderForm";
import { PbMenuItemPlugin } from "../../../../types";

export default new PbMenuItemPlugin({
    name: "pb-menu-item-folder",
    menuItem: {
        type: "folder",
        title: "Folder",
        icon: <LinkIcon />,
        canHaveChildren: true,
        renderForm(props) {
            return <FolderForm {...props} />;
        }
    }
});

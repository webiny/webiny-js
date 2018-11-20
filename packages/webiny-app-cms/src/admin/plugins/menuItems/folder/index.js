// @flow
import * as React from "react";
import { ReactComponent as LinkIcon } from "./round-folder-24px.svg";
import FolderForm from "./FolderForm";
import type { CmsMenuItemPluginType } from "webiny-app-cms/types";

export default ({
    name: "cms-menu-item-folder",
    type: "cms-menu-item",
    title: "Folder",
    icon: <LinkIcon />,
    canHaveChildren: true,
    renderForm(props: Object) {
        return <FolderForm {...props} />;
    }
}: CmsMenuItemPluginType);

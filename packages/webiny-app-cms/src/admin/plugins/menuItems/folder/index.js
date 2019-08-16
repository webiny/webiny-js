// @flow
import * as React from "react";
import { ReactComponent as LinkIcon } from "./round-folder-24px.svg";
import FolderForm from "./FolderForm";
import type { PageBuilderMenuItemPluginType } from "webiny-app-cms/types";

export default ({
    name: "pb-menu-item-folder",
    type: "pb-menu-item",
    title: "Folder",
    icon: <LinkIcon />,
    canHaveChildren: true,
    renderForm(props: Object) {
        return <FolderForm {...props} />;
    }
}: PageBuilderMenuItemPluginType);

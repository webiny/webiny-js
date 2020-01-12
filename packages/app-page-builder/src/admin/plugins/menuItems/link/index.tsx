import * as React from "react";
import { ReactComponent as LinkIcon } from "./round-link-24px.svg";
import LinkForm from "./LinkForm";
import { PbMenuItemPlugin } from "@webiny/app-page-builder/admin/types";

const plugin: PbMenuItemPlugin = {
    name: "pb-menu-item-link",
    type: "pb-menu-item",
    menuItem: {
        type: "link",
        title: "Link",
        icon: <LinkIcon />,
        canHaveChildren: false,
        renderForm(props) {
            return <LinkForm {...props} />;
        }
    }
};

export default plugin;

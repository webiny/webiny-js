import * as React from "react";
import { ReactComponent as PageIcon } from "./round-subject-24px.svg";
import PageForm from "./PageForm";
import { PbMenuItemPlugin } from "@webiny/app-page-builder/types";

const plugin: PbMenuItemPlugin = {
    name: "pb-menu-item-page",
    type: "pb-menu-item",
    menuItem: {
        type: "page",
        title: "Page",
        icon: <PageIcon />,
        canHaveChildren: false,
        renderForm(props) {
            return <PageForm {...props} />;
        }
    }
};

export default plugin;

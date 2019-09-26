// @flow
import * as React from "react";
import { ReactComponent as PageListIcon } from "./round-format_list_bulleted-24px.svg";
import PageListForm from "./PageListForm";
import type { PbMenuItemPluginType } from "@webiny/app-page-builder/types";

export default ({
    name: "pb-menu-item-page-list",
    type: "pb-menu-item",
    menuItem: {
        type: "pages-list",
        title: "Page list",
        icon: <PageListIcon />,
        canHaveChildren: false,
        renderForm(props: Object) {
            return <PageListForm {...props} />;
        }
    }
}: PbMenuItemPluginType);

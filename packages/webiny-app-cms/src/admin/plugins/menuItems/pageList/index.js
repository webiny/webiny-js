// @flow
import * as React from "react";
import { ReactComponent as PageListIcon } from "./round-format_list_bulleted-24px.svg";
import PageListForm from "./PageListForm";
import type { CmsMenuItemPluginType } from "webiny-app-cms/types";

export default ({
    name: "cms-menu-item-page-list",
    type: "cms-menu-item",
    title: "Page list",
    icon: <PageListIcon />,
    canHaveChildren: false,
    renderForm(props: Object) {
        return <PageListForm {...props} />;
    }
}: CmsMenuItemPluginType);

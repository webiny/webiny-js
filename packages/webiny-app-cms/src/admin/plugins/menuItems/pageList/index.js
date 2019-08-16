// @flow
import * as React from "react";
import { ReactComponent as PageListIcon } from "./round-format_list_bulleted-24px.svg";
import PageListForm from "./PageListForm";
import type { PageBuilderMenuItemPluginType } from "webiny-app-cms/types";

export default ({
    name: "page-builder-menu-item-page-list",
    type: "page-builder-menu-item",
    title: "Page list",
    icon: <PageListIcon />,
    canHaveChildren: false,
    renderForm(props: Object) {
        return <PageListForm {...props} />;
    }
}: PageBuilderMenuItemPluginType);

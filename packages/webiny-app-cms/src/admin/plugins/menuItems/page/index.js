// @flow
import * as React from "react";
import { ReactComponent as PageIcon } from "./round-subject-24px.svg";
import PageForm from "./PageForm";
import type { CmsMenuItemPluginType } from "webiny-app-cms/types";

export default ({
    name: "cms-menu-item-page",
    type: "cms-menu-item",
    title: "Page",
    icon: <PageIcon />,
    canHaveChildren: false,
    renderForm(props: Object) {
        return <PageForm {...props} />;
    }
}: CmsMenuItemPluginType);

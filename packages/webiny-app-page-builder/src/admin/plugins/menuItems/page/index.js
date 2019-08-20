// @flow
import * as React from "react";
import { ReactComponent as PageIcon } from "./round-subject-24px.svg";
import PageForm from "./PageForm";
import type { PbMenuItemPluginType } from "webiny-app-page-builder/types";

export default ({
    name: "pb-menu-item-page",
    type: "pb-menu-item",
    menuItem: {
        type: "page",
        title: "Page",
        icon: <PageIcon />,
        canHaveChildren: false,
        renderForm(props: Object) {
            return <PageForm {...props} />;
        }
    }
}: PbMenuItemPluginType);

// @flow
import * as React from "react";
import { ReactComponent as LinkIcon } from "./round-link-24px.svg";
import LinkForm from "./LinkForm";
import type { CmsMenuItemPluginType } from "webiny-app-cms/types";

export default ({
    name: "cms-menu-item-link",
    type: "cms-menu-item",
    title: "Link",
    icon: <LinkIcon />,
    canHaveChildren: false,
    renderForm(props: Object) {
        return <LinkForm {...props} />;
    }
}: CmsMenuItemPluginType);

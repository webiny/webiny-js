// @flow
import * as React from "react";
import { ReactComponent as LinkIcon } from "./round-link-24px.svg";
import LinkForm from "./LinkForm";
import type { PageBuilderMenuItemPluginType } from "webiny-app-cms/types";

export default ({
    name: "pb-menu-item-link",
    type: "pb-menu-item",
    title: "Link",
    icon: <LinkIcon />,
    canHaveChildren: false,
    renderForm(props: Object) {
        return <LinkForm {...props} />;
    }
}: PageBuilderMenuItemPluginType);

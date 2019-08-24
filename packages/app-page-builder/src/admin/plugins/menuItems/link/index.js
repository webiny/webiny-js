// @flow
import * as React from "react";
import { ReactComponent as LinkIcon } from "./round-link-24px.svg";
import LinkForm from "./LinkForm";
import type { PbMenuItemPluginType } from "@webiny/app-page-builder/types";

export default ({
    name: "pb-menu-item-link",
    type: "pb-menu-item",
    menuItem: {
        type: "link",
        title: "Link",
        icon: <LinkIcon />,
        canHaveChildren: false,
        renderForm(props: Object) {
            return <LinkForm {...props} />;
        }
    }
}: PbMenuItemPluginType);

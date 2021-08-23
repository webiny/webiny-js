import * as React from "react";
import { ReactComponent as CardIcon } from "./dynamic_feed_black_24px.svg";
import CardForm from "./CardForm";
import { PbMenuItemPlugin } from "@webiny/app-page-builder/types";

const plugin: PbMenuItemPlugin = {
    name: "pb-menu-item-card",
    type: "pb-menu-item",
    menuItem: {
        type: "card",
        title: "Card",
        icon: <CardIcon />,
        canHaveChildren: false,
        renderForm(props) {
            return <CardForm {...props} />;
        }
    }
};

export default plugin;

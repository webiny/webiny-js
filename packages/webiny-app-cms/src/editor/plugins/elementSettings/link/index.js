// @flow
import React from "react";
import type { PluginType } from "webiny-app-cms/types";
import { ReactComponent as LinkIcon } from "./round-link-24px.svg";
import LinkSettings from "./LinkSettings";
import Action from "../components/Action";

export default ({
    name: "cms-element-settings-link",
    type: "cms-element-settings",
    renderAction() {
        return <Action plugin={this.name} tooltip={"Link"} icon={<LinkIcon />} />;
    },
    renderMenu() {
        return <LinkSettings />;
    }
}: PluginType);

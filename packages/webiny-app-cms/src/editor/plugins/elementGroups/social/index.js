// @flow
import React from "react";
import { ReactComponent as SocialIcon } from "./round-people-24px.svg";
import type { ElementGroupPluginType } from "webiny-app-cms/types";

export default ({
    name: "pb-editor-element-group-social",
    type: "pb-editor-element-group",
    group: {
        title: "Social",
        icon: <SocialIcon />
    }
}: ElementGroupPluginType);

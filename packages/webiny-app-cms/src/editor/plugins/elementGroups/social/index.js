// @flow
import React from "react";
import { ReactComponent as SocialIcon } from "./round-people-24px.svg";
import type { ElementGroupPluginType } from "webiny-app-cms/types";

export default ({
    name: "cms-element-group-social",
    type: "cms-element-group",
    group: {
        title: "Social",
        icon: <SocialIcon />
    }
}: ElementGroupPluginType);

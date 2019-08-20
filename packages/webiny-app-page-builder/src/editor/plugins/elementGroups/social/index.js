// @flow
import React from "react";
import { ReactComponent as SocialIcon } from "./round-people-24px.svg";
import type { PbElementGroupPluginType } from "webiny-app-page-builder/types";

export default ({
    name: "pb-editor-element-group-social",
    type: "pb-editor-page-element-group",
    group: {
        title: "Social",
        icon: <SocialIcon />
    }
}: PbElementGroupPluginType);

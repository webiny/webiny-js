// @flow
import React from "react";
import { ReactComponent as MediaIcon } from "./round-music_video-24px.svg";
import type { ElementGroupPluginType } from "webiny-app-cms/types";

export default ({
    name: "pb-editor-element-group-media",
    type: "pb-editor-element-group",
    group: {
        title: "Media",
        icon: <MediaIcon />
    }
}: ElementGroupPluginType);

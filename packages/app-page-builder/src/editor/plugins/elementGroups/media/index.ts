// @flow
import React from "react";
import { ReactComponent as MediaIcon } from "./round-music_video-24px.svg";
import type { PbElementGroupPlugin } from "@webiny/app-page-builder/admin/types";

export default ({
    name: "pb-editor-element-group-media",
    type: "pb-editor-page-element-group",
    group: {
        title: "Media",
        icon: <MediaIcon />
    }
}: PbElementGroupPlugin);

import React from "react";
import { ReactComponent as MediaIcon } from "./round-music_video-24px.svg";
import { PbEditorPageElementGroupPlugin } from "../../../../types";

export default new PbEditorPageElementGroupPlugin({
    name: "pb-editor-element-group-media",
    group: {
        title: "Media",
        icon: <MediaIcon />
    }
});

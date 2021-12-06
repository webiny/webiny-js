import React from "react";
import { ReactComponent as SocialIcon } from "./round-people-24px.svg";
import { PbEditorPageElementGroupPlugin } from "../../../../types";

export default new PbEditorPageElementGroupPlugin({
    name: "pb-editor-element-group-social",
    group: {
        title: "Social",
        icon: <SocialIcon />
    }
});

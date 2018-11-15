// @flow
import * as React from "react";
import { ReactComponent as SocialIcon } from "./round-thumb_up-24px.svg";
import GeneralSettings from "./GeneralSettings";

export default {
    name: "cms-editor-page-settings-social",
    type: "cms-editor-page-settings",
    title: "Social media",
    description: "Set share images and settings for social media sites.",
    icon: <SocialIcon />,
    render(props: Object) {
        return <GeneralSettings {...props} />;
    }
};

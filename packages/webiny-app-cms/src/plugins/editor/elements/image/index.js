import React from "react";
import Image from "./Image";
import styled from "react-emotion";
import { ReactComponent as ImageIcon } from "webiny-app-cms/editor/assets/icons/image-icon.svg";
import { ReactComponent as ImageGroupIcon } from "webiny-app-cms/editor/assets/icons/round-collections-24px.svg";

const PreviewBox = styled("div")({
    textAlign: "center",
    height: 50,
    svg: {
        height: 50,
        width: 50
    }
});

export default {
    name: "image",
    type: "cms-element",
    element: {
        title: "Image",
        group: "Image",
        groupIcon: <ImageGroupIcon />,
        settings: [
            "element-settings-background",
            "",
            "element-settings-border",
            "element-settings-shadow",
            "",
            "element-settings-padding",
            "element-settings-margin",
            "",
            "element-settings-clone",
            "element-settings-delete",
            "",
            "element-settings-advanced"
        ]
    },
    target: ["column", "row"],
    create(options) {
        return { type: "image", elements: [], ...options };
    },
    render(props) {
        return <Image {...props} />;
    },
    preview() {
        return (
            <PreviewBox>
                <ImageIcon />
            </PreviewBox>
        );
    }
};

import React from "react";
import styled from "react-emotion";
import Spacer, { INIT_HEIGHT } from "./Spacer";
import { ReactComponent as SpacerIcon } from "webiny-app-cms/editor/assets/icons/spacer-icon.svg";
import "./actions";

const PreviewBox = styled("div")({
    textAlign: "center",
    height: 50,
    svg: {
        height: 50,
        width: 50
    }
});

export default {
    name: "spacer",
    type: "cms-element",
    element: {
        title: "Spacer",
        group: "Layout",
        settings: ["element-settings-delete"]
    },
    target: ["block", "column"],
    create(options = {}) {
        return {
            type: "spacer",
            settings: { style: { height: INIT_HEIGHT } },
            ...options
        };
    },
    render(props) {
        return <Spacer {...props} />;
    },
    preview() {
        return (
            <PreviewBox>
                <SpacerIcon />
            </PreviewBox>
        );
    }
};

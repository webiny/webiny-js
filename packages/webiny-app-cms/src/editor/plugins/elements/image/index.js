// @flow
import React from "react";
import Image from "./Image";
import styled from "react-emotion";
import { ReactComponent as ImageIcon } from "webiny-app-cms/editor/assets/icons/image-icon.svg";
import type { ElementPluginType } from "webiny-app-cms/types";

export default (): ElementPluginType => {
    const PreviewBox = styled("div")({
        textAlign: "center",
        height: 50,
        svg: {
            height: 50,
            width: 50
        }
    });

    return {
        name: "cms-element-image",
        type: "cms-element",
        toolbar: {
            title: "Image",
            group: "cms-element-group-image",
            preview() {
                return (
                    <PreviewBox>
                        <ImageIcon />
                    </PreviewBox>
                );
            }
        },
        settings: [
            "cms-element-settings-background",
            "",
            "cms-element-settings-border",
            "cms-element-settings-shadow",
            "",
            "cms-element-settings-padding",
            "cms-element-settings-margin",
            "",
            "cms-element-settings-clone",
            "cms-element-settings-delete",
            "",
            "cms-element-settings-advanced"
        ],
        target: ["cms-element-column", "cms-element-row"],
        create(options) {
            return { type: "cms-element-image", elements: [], ...options };
        },
        render(props) {
            return <Image {...props} />;
        }
    };
};

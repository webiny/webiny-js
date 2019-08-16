// @flow
import React from "react";
import styled from "react-emotion";
import Spacer, { INIT_HEIGHT } from "./Spacer";
import { ReactComponent as SpacerIcon } from "webiny-app-cms/editor/assets/icons/spacer-icon.svg";
import "./actions";
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
        name: "pb-page-element-spacer",
        type: "pb-page-element",
        elementType: "spacer",
        toolbar: {
            title: "Spacer",
            group: "pb-page-element-group-layout",
            preview() {
                return (
                    <PreviewBox>
                        <SpacerIcon />
                    </PreviewBox>
                );
            }
        },
        settings: ["pb-page-element-settings-delete"],
        target: ["pb-page-element-block", "pb-page-element-column"],
        create(options = {}) {
            return {
                type: "pb-page-element-spacer",
                data: {
                    settings: {
                        height: INIT_HEIGHT,
                        margin: { desktop: { all: 0 } },
                        padding: { desktop: { all: 0 } }
                    }
                },

                ...options
            };
        },
        render(props) {
            return <Spacer {...props} />;
        }
    };
};

// @flow
import React from "react";
import styled from "@emotion/styled";
import Spacer, { INIT_HEIGHT } from "./Spacer";
import { ReactComponent as SpacerIcon } from "@webiny/app-page-builder/editor/assets/icons/spacer-icon.svg";
import "./actions";
import type { PbElementPluginType } from "@webiny/app-page-builder/types";

export default (): PbElementPluginType => {
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
            group: "pb-editor-element-group-layout",
            preview() {
                return (
                    <PreviewBox>
                        <SpacerIcon />
                    </PreviewBox>
                );
            }
        },
        settings: ["pb-page-element-settings-delete"],
        target: ["block", "column"],
        create(options = {}) {
            return {
                type: "spacer",
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

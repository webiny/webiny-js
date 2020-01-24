import React from "react";
import styled from "@emotion/styled";
import Spacer, { INIT_HEIGHT } from "./Spacer";
import { ReactComponent as SpacerIcon } from "@webiny/app-page-builder/editor/assets/icons/spacer-icon.svg";
import "./actions";
import { PbEditorPageElementPlugin } from "@webiny/app-page-builder/admin/types";

export default (): PbEditorPageElementPlugin => {
    const PreviewBox = styled("div")({
        textAlign: "center",
        height: 50,
        svg: {
            height: 50,
            width: 50
        }
    });

    return {
        name: "pb-editor-page-element-spacer",
        type: "pb-editor-page-element",
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
        settings: ["pb-editor-page-element-settings-delete"],
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

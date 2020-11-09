import React from "react";
import styled from "@emotion/styled";
import ImageSettings from "./ImageSettings";
import Image from "./Image";
import { imageCreatedEditorAction } from "./imageCreatedEditorAction";
import { CreateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { ReactComponent as ImageIcon } from "./round-image-24px.svg";
import Action from "../../elementSettings/components/Action";
import {
    PbEditorPageElementPlugin,
    PbEditorPageElementSettingsPlugin,
    PbEditorEventActionPlugin
} from "@webiny/app-page-builder/types";
import { Plugin } from "@webiny/plugins/types";

const PreviewBox = styled("div")({
    textAlign: "center",
    height: 50,
    svg: {
        height: 50,
        width: 50
    }
});

export default (): Plugin[] => {
    return [
        {
            name: "pb-editor-page-element-image",
            type: "pb-editor-page-element",
            elementType: "image",
            toolbar: {
                title: "Image",
                group: "pb-editor-element-group-basic",
                preview() {
                    return (
                        <PreviewBox>
                            <ImageIcon />
                        </PreviewBox>
                    );
                }
            },
            settings: [
                "pb-editor-page-element-settings-image",
                ["pb-editor-page-element-settings-background", { image: false }],
                "pb-editor-page-element-settings-link",
                "",
                "pb-editor-page-element-settings-border",
                "pb-editor-page-element-settings-shadow",
                "",
                [
                    "pb-editor-page-element-settings-horizontal-align",
                    { alignments: ["left", "center", "right"] }
                ],
                "pb-editor-page-element-settings-padding",
                "pb-editor-page-element-settings-margin",
                "",
                "pb-editor-page-element-settings-clone",
                "pb-editor-page-element-settings-delete",
                ""
            ],
            target: ["cell", "block"],
            create(options) {
                return {
                    type: "image",
                    elements: [],
                    data: {
                        settings: {
                            horizontalAlign: "center",
                            margin: {
                                desktop: { all: 0 },
                                mobile: { top: 0, left: 0, right: 0, bottom: 15 },
                                advanced: true
                            },
                            padding: {
                                desktop: { all: 0 },
                                mobile: { all: 0 }
                            }
                        }
                    },
                    ...options
                };
            },
            render({ element }) {
                return <Image element={element} />;
            }
        } as PbEditorPageElementPlugin,
        {
            name: "pb-editor-page-element-settings-image",
            type: "pb-editor-page-element-settings",
            renderAction() {
                return <Action plugin={this.name} tooltip={"Image"} icon={<ImageIcon />} />;
            },
            renderMenu() {
                return <ImageSettings />;
            }
        } as PbEditorPageElementSettingsPlugin,
        {
            name: "pb-editor-event-action-image-created",
            type: "pb-editor-event-action-plugin",
            onEditorMount(handler) {
                return handler.on(CreateElementActionEvent, imageCreatedEditorAction);
            }
        } as PbEditorEventActionPlugin
    ];
};

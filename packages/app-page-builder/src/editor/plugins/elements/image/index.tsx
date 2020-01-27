import React from "react";
import styled from "@emotion/styled";
import { getPlugins } from "@webiny/plugins";
import { ELEMENT_CREATED } from "@webiny/app-page-builder/editor/actions";
import { ReactComponent as ImageIcon } from "./round-image-24px.svg";
import ImageSettings from "./ImageSettings";
import Image from "./Image";
import Action from "../../elementSettings/components/Action";
import {
    PbEditorReduxMiddlewarePlugin,
    PbEditorPageElementPlugin,
    PbEditorPageElementSettingsPlugin
} from "@webiny/app-page-builder/admin/types";

export default () => {
    const PreviewBox = styled("div")({
        textAlign: "center",
        height: 50,
        svg: {
            height: 50,
            width: 50
        }
    });

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
            target: ["column", "row"],
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
            type: "pb-editor-redux-middleware",
            name: "pb-editor-redux-middleware-image-created",
            actions: [ELEMENT_CREATED],
            middleware: ({ action, next }) => {
                const { element, source } = action.payload;

                next(action);

                if (element.type !== "image") {
                    return;
                }

                // Check the source of the element (could be `saved` element which behaves differently from other elements)
                const imagePlugin = getPlugins<PbEditorPageElementPlugin>("pb-editor-page-element").find(
                    pl => pl.elementType === source.type
                );

                if (!imagePlugin) {
                    return;
                }

                const { onCreate } = imagePlugin;
                if (!onCreate || onCreate !== "skip") {
                    // If source element does not define a specific `onCreate` behavior - continue with the actual element plugin
                    // TODO: this isn't an ideal approach, implement a retry mechanism which polls for DOM element
                    setTimeout(() => {
                        const image: HTMLElement = document.querySelector(
                            `#${window.CSS.escape(element.id)} [data-role="select-image"]`
                        );

                        if (image) {
                            image.click();
                        }
                    }, 100);
                }
            }
        } as PbEditorReduxMiddlewarePlugin
    ];
};

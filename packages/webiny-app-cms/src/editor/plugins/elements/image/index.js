// @flow
import React from "react";
import styled from "react-emotion";
import { getPlugin } from "webiny-plugins";
import { addMiddleware } from "webiny-app-cms/editor/redux";
import { ELEMENT_CREATED } from "webiny-app-cms/editor/actions";
import type { PluginType } from "webiny-plugins/types";
import { ReactComponent as ImageIcon } from "./round-image-24px.svg";
import ImageSettings from "./ImageSettings";
import Image from "./Image";
import Action from "../../elementSettings/components/Action";

export default (): Array<PluginType> => {
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
            name: "cms-element-image",
            type: "cms-element",
            toolbar: {
                title: "Image",
                group: "cms-element-group-basic",
                preview() {
                    return (
                        <PreviewBox>
                            <ImageIcon />
                        </PreviewBox>
                    );
                }
            },
            settings: [
                "cms-element-settings-image",
                ["cms-element-settings-background", { image: false }],
                "cms-element-settings-link",
                "",
                "cms-element-settings-border",
                "cms-element-settings-shadow",
                "",
                [
                    "cms-element-settings-horizontal-align",
                    { alignments: ["left", "center", "right"] }
                ],
                "cms-element-settings-padding",
                "cms-element-settings-margin",
                "",
                "cms-element-settings-clone",
                "cms-element-settings-delete",
                ""
            ],
            target: ["cms-element-column", "cms-element-row"],
            init() {
                addMiddleware([ELEMENT_CREATED], ({ action, next }) => {
                    const { element, source } = action.payload;

                    next(action);

                    if (element.type !== "cms-element-image") {
                        return;
                    }

                    // Check the source of the element (could be `saved` element which behaves differently from other elements)
                    const imagePlugin = getPlugin(source.type);
                    if (!imagePlugin) {
                        return;
                    }

                    const { onCreate } = imagePlugin;
                    if (!onCreate || onCreate !== "skip") {
                        // If source element does not define a specific `onCreate` behavior - continue with the actual element plugin
                        const image = document.querySelector(
                            `#${window.CSS.escape(element.id)} [data-role="select-image"]`
                        );

                        if (image) {
                            image.click();
                        }
                    }
                });
            },
            create(options) {
                return {
                    type: "cms-element-image",
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
                return <Image elementId={element.id} />;
            }
        },
        {
            name: "cms-element-settings-image",
            type: "cms-element-settings",
            renderAction() {
                return <Action plugin={this.name} tooltip={"Image"} icon={<ImageIcon />} />;
            },
            renderMenu() {
                return <ImageSettings />;
            }
        }
    ];
};

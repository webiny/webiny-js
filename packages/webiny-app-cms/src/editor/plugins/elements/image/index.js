// @flow
import React from "react";
import Image from "./Image";
import styled from "react-emotion";
import { getPlugin } from "webiny-plugins";
import { addMiddleware } from "webiny-app-cms/editor/redux";
import { ELEMENT_CREATED } from "webiny-app-cms/editor/actions";
import { ElementRoot } from "webiny-app-cms/render/components/ElementRoot";

import type { PluginType } from "webiny-plugins/types";
import { Grid, Cell } from "webiny-ui/Grid";
import { Tab } from "webiny-ui/Tabs";
import { Input } from "webiny-ui/Input";
import { Select } from "webiny-ui/Select";
import { ReactComponent as ImageIcon } from "./round-image-24px.svg";

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
                "cms-element-settings-background",
                "cms-element-settings-link",
                "",
                "cms-element-settings-border",
                "cms-element-settings-shadow",
                "",
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
                return (
                    <ElementRoot
                        element={element}
                        className={"webiny-cms-base-element-style webiny-cms-element-image"}
                    >
                        <Image elementId={element.id} />
                    </ElementRoot>
                );
            }
        },
        {
            name: "cms-element-advanced-settings-image",
            type: "cms-element-advanced-settings",
            element: "cms-element-image",
            render({ Bind }) {
                return (
                    <Tab icon={<ImageIcon />} label="Image">
                        <Grid>
                            <Cell span={12}>
                                <Bind name={"image.title"} defaultValue={""}>
                                    <Input label="Image title" />
                                </Bind>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <Bind name={"image.alt"} defaultValue={""}>
                                    <Input
                                        label="Alternate text (alt)"
                                        description={
                                            "Specifies an alternate text for an image, if the image cannot be displayed."
                                        }
                                    />
                                </Bind>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={6}>
                                <Bind name={"image.width"} defaultValue={""}>
                                    <Input
                                        label="Width"
                                        placeholder="auto"
                                        description="eg. 300 or 50%"
                                    />
                                </Bind>
                            </Cell>
                            <Cell span={6}>
                                <Bind name={"image.height"} defaultValue={""}>
                                    <Input
                                        label="Height"
                                        placeholder="auto"
                                        description="eg. 300 or 50%"
                                    />
                                </Bind>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <Bind name={"image.align"} defaultValue={"center"}>
                                    <Select label="Align">
                                        <option value="left">Left</option>
                                        <option value="center">Center</option>
                                        <option value="right">Right</option>
                                    </Select>
                                </Bind>
                            </Cell>
                        </Grid>
                    </Tab>
                );
            }
        }
    ];
};

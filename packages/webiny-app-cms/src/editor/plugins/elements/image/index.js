// @flow
import React from "react";
import Image from "./Image";
import styled from "react-emotion";
import { ReactComponent as ImageIcon } from "webiny-app-cms/editor/assets/icons/image-icon.svg";
import type { ElementPluginType } from "webiny-app-cms/types";
import { updateElement } from "webiny-app-cms/editor/actions";
import { get, set } from "dot-prop-immutable";
import { redux } from "webiny-app-cms/editor/redux";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";

export default (): ElementPluginType => {
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
            render({ element }) {
                const attributes = get(element, "settings.advanced.img", {});

                return (
                    <Image
                        {...attributes}
                        value={element.data}
                        onChange={data => {
                            redux.store.dispatch(
                                updateElement({ element: set(element, "data", data) })
                            );
                        }}
                    />
                );
            }
        },
        {
            type: "cms-element-sidebar",
            name: "cms-element-sidebar-image",
            element: "cms-element-image",
            render({ Bind }) {
                return (
                    <React.Fragment>
                        <Grid>
                            <Cell span={12}>
                                <Bind name={"img.title"} defaultValue={""}>
                                    <Input label="Image title" />
                                </Bind>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <Bind name={"img.alt"} defaultValue={""}>
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
                                <Bind name={"img.width"} defaultValue={""}>
                                    <Input label="Width" />
                                </Bind>
                            </Cell>
                            <Cell span={6}>
                                <Bind name={"img.height"} defaultValue={""}>
                                    <Input label="Height" />
                                </Bind>
                            </Cell>
                        </Grid>
                    </React.Fragment>
                );
            }
        }
    ];
};

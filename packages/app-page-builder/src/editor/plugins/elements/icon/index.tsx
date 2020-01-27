import React from "react";
import { ReactComponent as IconSvg } from "./round-star_border-24px.svg";
import IconSettings from "./IconSettings";
import styled from "@emotion/styled";
import Icon from "./Icon";
import { getSvg } from "./utils";
import Action from "./../../elementSettings/components/Action";
import { PbEditorPageElementPlugin, PbEditorPageElementSettingsPlugin } from "@webiny/app-page-builder/types";

export default () => {
    const PreviewBox = styled("div")({
        textAlign: "center",
        height: 50,
        color: "var(--mdc-theme-text-primary-on-background)",
        svg: {
            height: 50,
            width: 50
        }
    });

    return [
        {
            name: "pb-editor-page-element-icon",
            type: "pb-editor-page-element",
            elementType: "icon",
            toolbar: {
                title: "Icon",
                group: "pb-editor-element-group-basic",
                preview() {
                    return (
                        <PreviewBox>
                            <IconSvg />
                        </PreviewBox>
                    );
                }
            },
            settings: [
                "pb-editor-page-element-settings-icon",
                "",
                "pb-editor-page-element-settings-padding",
                "pb-editor-page-element-settings-margin",
                [
                    "pb-editor-page-element-settings-horizontal-align",
                    { alignments: ["left", "center", "right"] }
                ],
                "",
                "pb-editor-page-element-settings-clone",
                "pb-editor-page-element-settings-delete",
                ""
            ],
            target: ["column", "row"],
            create(options) {
                return {
                    type: "icon",
                    elements: [],
                    data: {
                        icon: {
                            id: ["far", "star"],
                            svg: getSvg(["far", "star"]),
                            width: 50
                        },
                        settings: {
                            horizontalAlign: "center",
                            margin: {
                                desktop: { all: 0 },
                                mobile: { all: 0 }
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
            render(props) {
                return <Icon {...props} />;
            }
        } as PbEditorPageElementPlugin,
        {
            name: "pb-editor-page-element-settings-icon",
            type: "pb-editor-page-element-settings",
            renderAction() {
                return <Action plugin={this.name} tooltip={"Icon"} icon={<IconSvg />} />;
            },
            renderMenu() {
                return <IconSettings />;
            }
        } as PbEditorPageElementSettingsPlugin
    ];
};

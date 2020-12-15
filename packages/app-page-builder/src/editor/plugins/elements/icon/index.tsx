import React from "react";
import styled from "@emotion/styled";
import {
    PbEditorPageElementPlugin,
    PbEditorPageElementStyleSettingsPlugin
} from "@webiny/app-page-builder/types";
// Icons
import { ReactComponent as IconSvg } from "./round-star_border-24px.svg";
// Components
import IconSettings from "./IconSettings";
import Icon from "./Icon";
import { getSvg } from "../utils/iconUtils";

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
                "pb-editor-page-element-style-settings-icon",
                "pb-editor-page-element-style-settings-padding",
                "pb-editor-page-element-style-settings-margin",
                [
                    "pb-editor-page-element-style-settings-horizontal-align",
                    { alignments: ["left", "center", "right"] }
                ],
                "pb-editor-page-element-settings-clone",
                "pb-editor-page-element-settings-delete"
            ],
            target: ["cell", "block"],
            create(options) {
                return {
                    type: "icon",
                    elements: [],
                    data: {
                        icon: {
                            id: ["far", "star"],
                            svg: getSvg(["far", "star"], { width: 50 }),
                            width: 50
                        },
                        settings: {
                            alignment: "horizontalLeft",
                            horizontalAlign: "center",
                            margin: {
                                desktop: { all: "0px" },
                                mobile: { all: "0px" }
                            },
                            padding: {
                                desktop: { all: "0px" },
                                mobile: { all: "0px" }
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
            name: "pb-editor-page-element-style-settings-icon",
            type: "pb-editor-page-element-style-settings",
            render() {
                return <IconSettings />;
            }
        } as PbEditorPageElementStyleSettingsPlugin
    ];
};

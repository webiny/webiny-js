import React from "react";
import styled from "@emotion/styled";
import kebabCase from "lodash/kebabCase";
import {
    PbEditorPageElementPlugin,
    PbEditorPageElementStyleSettingsPlugin,
    DisplayMode,
    PbEditorElementPluginArgs,
    PbEditorElement
} from "~/types";
import { createInitialPerDeviceSettingValue } from "../../elementSettings/elementSettingsUtils";
// Icons
import { ReactComponent as IconSvg } from "./round-star_border-24px.svg";
// Components
import IconSettings from "./IconSettings";
import Icon from "./Icon";
import { getSvg } from "../utils/iconUtils";

export default (args: PbEditorElementPluginArgs = {}) => {
    const PreviewBox = styled("div")({
        textAlign: "center",
        height: 50,
        color: "var(--mdc-theme-text-primary-on-background)",
        svg: {
            height: 50,
            width: 50
        }
    });

    const elementType = kebabCase(args.elementType || "icon");

    const defaultToolbar = {
        title: "Icon",
        group: "pb-editor-element-group-basic",
        preview() {
            return (
                <PreviewBox>
                    <IconSvg />
                </PreviewBox>
            );
        }
    };

    const defaultSettings = [
        "pb-editor-page-element-style-settings-icon",
        "pb-editor-page-element-style-settings-padding",
        "pb-editor-page-element-style-settings-margin",
        [
            "pb-editor-page-element-style-settings-horizontal-align",
            { alignments: ["left", "center", "right"] }
        ],
        "pb-editor-page-element-style-settings-position",
        "pb-editor-page-element-settings-clone",
        "pb-editor-page-element-settings-delete"
    ];

    return [
        {
            name: `pb-editor-page-element-${elementType}`,
            type: "pb-editor-page-element",
            elementType: elementType,
            toolbar:
                typeof args.toolbar === "function" ? args.toolbar(defaultToolbar) : defaultToolbar,
            settings:
                typeof args.settings === "function"
                    ? args.settings(defaultSettings)
                    : defaultSettings,
            target: ["cell", "block"],
            create(options) {
                const defaultValue: Partial<PbEditorElement> = {
                    type: this.elementType,
                    elements: [],
                    data: {
                        icon: {
                            id: ["far", "star"],
                            svg: getSvg(["far", "star"], { width: 50 }),
                            width: 50
                        },
                        settings: {
                            horizontalAlign: "center",
                            margin: createInitialPerDeviceSettingValue(
                                { all: "0px" },
                                DisplayMode.DESKTOP
                            ),
                            padding: createInitialPerDeviceSettingValue(
                                { all: "0px" },
                                DisplayMode.DESKTOP
                            )
                        }
                    },
                    ...options
                };
                return typeof args.create === "function" ? args.create(defaultValue) : defaultValue;
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

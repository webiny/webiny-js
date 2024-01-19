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
                            value: {
                                type: "icon",
                                name: "regular_star",
                                value: '<path fill="currentColor" d="M287.9 0c9.2 0 17.6 5.2 21.6 13.5l68.6 141.3l153.2 22.6c9 1.3 16.5 7.6 19.3 16.3s.5 18.1-5.9 24.5L433.6 328.4L459.8 484c1.5 9-2.2 18.1-9.6 23.5s-17.3 6-25.3 1.7l-137-73.2L151 509.1c-8.1 4.3-17.9 3.7-25.3-1.7s-11.2-14.5-9.7-23.5l26.2-155.6L31.1 218.2c-6.5-6.4-8.7-15.9-5.9-24.5s10.3-14.9 19.3-16.3l153.2-22.6l68.6-141.3C270.4 5.2 278.7 0 287.9 0zm0 79l-52.5 108.2c-3.5 7.1-10.2 12.1-18.1 13.3L99 217.9l85.9 85.1c5.5 5.5 8.1 13.3 6.8 21l-20.3 119.7l105.2-56.2c7.1-3.8 15.6-3.8 22.6 0l105.2 56.2l-20.2-119.6c-1.3-7.7 1.2-15.5 6.8-21l85.9-85.1l-118.3-17.5c-7.8-1.2-14.6-6.1-18.1-13.3L287.9 79z"/>',
                                width: 576
                            },
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

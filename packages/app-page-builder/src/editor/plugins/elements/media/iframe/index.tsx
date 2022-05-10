import React from "react";
import IFrame from "./IFrame";
import IFrameSettings from "./IFrameSettings";
import styled from "@emotion/styled";
import { ReactComponent as IFrameIcon } from "./iframe-icon.svg";
import {
    DisplayMode,
    PbEditorPageElementPlugin,
    PbEditorPageElementStyleSettingsPlugin
} from "~/types";
import { createInitialPerDeviceSettingValue } from "../../../elementSettings/elementSettingsUtils";

const PreviewBox = styled("div")({
    textAlign: "center",
    height: 50,
    svg: {
        height: 50,
        width: 50,
        color: "var(--mdc-theme-text-primary-on-background)"
    }
});

export default () => {
    return [
        {
            name: "pb-editor-page-element-iframe",
            type: "pb-editor-page-element",
            elementType: "iframe",
            toolbar: {
                title: "iFrame",
                group: "pb-editor-element-group-media",
                preview() {
                    return (
                        <PreviewBox>
                            <IFrameIcon />
                        </PreviewBox>
                    );
                }
            },
            settings: [
                "pb-editor-page-element-settings-delete",
                "pb-editor-page-element-style-settings-height",
                "pb-editor-page-element-style-settings-width",
                "pb-editor-page-element-style-settings-border",
                "pb-editor-page-element-style-settings-shadow",
                "pb-editor-page-element-style-settings-padding",
                "pb-editor-page-element-style-settings-margin",
                "pb-editor-page-element-style-settings-iframe"
            ],
            target: ["cell", "block"],
            create(options) {
                return {
                    type: "iframe",
                    elements: [],
                    data: {
                        iframe: {
                            url: ""
                        },
                        settings: {
                            height: createInitialPerDeviceSettingValue(
                                { value: "380px" },
                                DisplayMode.DESKTOP
                            )
                        }
                    },
                    ...options
                };
            },
            render(props) {
                return <IFrame {...props} />;
            },
            renderElementPreview({ width, height }) {
                return <img style={{ width, height }} alt={"iFrame"} />;
            }
        } as PbEditorPageElementPlugin,
        {
            name: "pb-editor-page-element-style-settings-iframe",
            type: "pb-editor-page-element-style-settings",
            render() {
                return <IFrameSettings />;
            }
        } as PbEditorPageElementStyleSettingsPlugin
    ];
};

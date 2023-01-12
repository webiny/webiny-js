import React from "react";
import styled from "@emotion/styled";
import kebabCase from "lodash/kebabCase";
import ImageSettings from "./ImageSettings";
import Image from "./Image";
import { imageCreatedEditorAction } from "./imageCreatedEditorAction";
import { CreateElementActionEvent } from "../../../recoil/actions";
import { ReactComponent as ImageIcon } from "./round-image-24px.svg";
import {
    PbEditorPageElementPlugin,
    PbEditorPageElementStyleSettingsPlugin,
    PbEditorEventActionPlugin,
    DisplayMode,
    PbEditorElementPluginArgs,
    PbEditorElement
} from "../../../../types";
import { Plugin } from "@webiny/plugins/types";
import { createInitialPerDeviceSettingValue } from "../../elementSettings/elementSettingsUtils";
import { createImage } from "@webiny/app-page-builder-elements/renderers/image";

const PreviewBox = styled("div")({
    textAlign: "center",
    height: 50,
    svg: {
        height: 50,
        width: 50
    }
});

export default (args: PbEditorElementPluginArgs = {}): Plugin[] => {
    const elementType = kebabCase(args.elementType || "image");

    const defaultToolbar = {
        title: "Image",
        group: "pb-editor-element-group-basic",
        preview() {
            return (
                <PreviewBox>
                    <ImageIcon />
                </PreviewBox>
            );
        }
    };

    const defaultSettings = [
        "pb-editor-page-element-style-settings-image",
        ["pb-editor-page-element-style-settings-background", { image: false }],
        "pb-editor-page-element-style-settings-link",
        "pb-editor-page-element-style-settings-border",
        "pb-editor-page-element-style-settings-shadow",
        "pb-editor-page-element-style-settings-horizontal-align-flex",
        "pb-editor-page-element-style-settings-padding",
        "pb-editor-page-element-style-settings-margin",
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
                        settings: {
                            horizontalAlignFlex: createInitialPerDeviceSettingValue(
                                "center",
                                DisplayMode.DESKTOP
                            ),
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
                return <Image {...props} />;
            },
            renderer: createImage()
        } as PbEditorPageElementPlugin,
        {
            name: "pb-editor-page-element-style-settings-image",
            type: "pb-editor-page-element-style-settings",
            render() {
                return <ImageSettings />;
            }
        } as PbEditorPageElementStyleSettingsPlugin,
        {
            name: "pb-editor-event-action-image-created",
            type: "pb-editor-event-action-plugin",
            onEditorMount(handler) {
                return handler.on(CreateElementActionEvent, imageCreatedEditorAction);
            }
        } as PbEditorEventActionPlugin
    ];
};

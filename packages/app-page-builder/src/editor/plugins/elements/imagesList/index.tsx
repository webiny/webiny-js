import React from "react";
import styled from "@emotion/styled";
import kebabCase from "lodash/kebabCase";
import {
    PbEditorPageElementPlugin,
    PbEditorPageElementAdvancedSettingsPlugin,
    DisplayMode,
    PbEditorElementPluginArgs,
    OnCreateActions
} from "../../../../types";
import { createInitialPerDeviceSettingValue } from "../../elementSettings/elementSettingsUtils";
import ImagesList from "./ImagesList";
import ImagesListImagesSettings from "./ImagesListImagesSettings";
import ImagesListDesignSettings from "./ImagesListDesignSettings";

import { ReactComponent as ImageGalleryIcon } from "./icons/round-photo_library-24px.svg";

export default (args: PbEditorElementPluginArgs = {}) => {
    const PreviewBox = styled("div")({
        textAlign: "center",
        margin: "0 auto",
        width: 50,
        svg: {
            width: 50
        }
    });

    const elementType: string = kebabCase(args.elementType || "images-list");

    const defaultToolbar = {
        title: "Image Gallery",
        group: "pb-editor-element-group-basic",
        preview() {
            return (
                <PreviewBox>
                    <ImageGalleryIcon />
                </PreviewBox>
            );
        }
    };

    const defaultSettings = ["pb-editor-page-element-settings-delete"];

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
            onCreate: OnCreateActions.OPEN_SETTINGS,
            create(options = {}) {
                const defaultValue = {
                    type: this.elementType,
                    data: {
                        component: "mosaic",
                        settings: {
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
            render({ element }) {
                // TODO @ts-refactor
                return <ImagesList data={element.data as any} />;
            }
        } as PbEditorPageElementPlugin,
        {
            name: "pb-editor-page-element-advanced-settings-images-list-filter",
            type: "pb-editor-page-element-advanced-settings",
            elementType: elementType,
            render(props) {
                return <ImagesListImagesSettings {...props} />;
            }
        } as PbEditorPageElementAdvancedSettingsPlugin,
        {
            name: "pb-editor-page-element-advanced-settings-images-list-design",
            type: "pb-editor-page-element-advanced-settings",
            elementType: elementType,
            render(props) {
                return <ImagesListDesignSettings {...props} />;
            }
        } as PbEditorPageElementAdvancedSettingsPlugin
    ];
};

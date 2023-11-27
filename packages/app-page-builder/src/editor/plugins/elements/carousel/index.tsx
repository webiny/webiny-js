import React from "react";
import kebabCase from "lodash/kebabCase";
import styled from "@emotion/styled";
import { createElement } from "~/editor/helpers";
import { ReactComponent as CarouselIcon } from "@material-design-icons/svg/round/view_carousel.svg";
import { createInitialPerDeviceSettingValue } from "~/editor/plugins/elementSettings/elementSettingsUtils";
import { PbEditorPageElementPlugin, PbEditorElementPluginArgs, DisplayMode } from "~/types";
import Carousel from "./Carousel";

const PreviewBox = styled.div`
    text-align: center;
    height: 50;
    & svg {
        height: 50;
        width: 50;
    }
`;

export default (args: PbEditorElementPluginArgs = {}): PbEditorPageElementPlugin => {
    const defaultSettings = [
        "pb-editor-page-element-style-settings-carousel",
        "pb-editor-page-element-style-settings-carousel-styles",
        "pb-editor-page-element-style-settings-background",
        "pb-editor-page-element-style-settings-animation",
        "pb-editor-page-element-style-settings-border",
        "pb-editor-page-element-style-settings-shadow",
        "pb-editor-page-element-style-settings-padding",
        "pb-editor-page-element-style-settings-margin",
        "pb-editor-page-element-style-settings-width",
        "pb-editor-page-element-style-settings-height",
        "pb-editor-page-element-settings-clone",
        "pb-editor-page-element-settings-delete"
    ];

    const elementType = kebabCase(args.elementType || "carousel");

    const defaultToolbar = {
        title: "Carousel",
        group: "pb-editor-element-group-layout",
        preview() {
            return (
                <PreviewBox>
                    <CarouselIcon />
                </PreviewBox>
            );
        }
    };

    return {
        type: "pb-editor-page-element",
        name: `pb-editor-page-element-${elementType}`,
        elementType: elementType,
        // @ts-expect-error
        toolbar: typeof args.toolbar === "function" ? args.toolbar(defaultToolbar) : defaultToolbar,
        settings:
            typeof args.settings === "function" ? args.settings(defaultSettings) : defaultSettings,
        canDelete: () => {
            return true;
        },
        create: () => {
            const defaultValue = {
                type: elementType,
                elements: [
                    createElement("carousel-element"),
                    createElement("carousel-element"),
                    createElement("carousel-element")
                ],
                data: {
                    settings: {
                        carousel: {
                            label: "Carousel Label",
                            arrowsToggle: true,
                            bulletsToggle: true
                        },
                        padding: createInitialPerDeviceSettingValue(
                            { all: "10px" },
                            DisplayMode.DESKTOP
                        )
                    }
                }
            };
            return typeof args.create === "function" ? args.create(defaultValue) : defaultValue;
        },
        render(props) {
            return <Carousel {...props} />;
        }
    };
};

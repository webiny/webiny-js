import React from "react";
import styled from "@emotion/styled";
import kebabCase from "lodash/kebabCase";
import { ReactComponent as TabsIcon } from "@material-design-icons/svg/round/tab.svg";
import { createInitialPerDeviceSettingValue } from "~/editor/plugins/elementSettings/elementSettingsUtils";
import { createElement } from "~/editor/helpers";
import Tabs from "./Tabs";
import { PbEditorPageElementPlugin, PbEditorElementPluginArgs, DisplayMode } from "~/types";

const PreviewBox = styled("div")({
    textAlign: "center",
    height: 50,
    svg: {
        height: 50,
        width: 50
    }
});

export default (args: PbEditorElementPluginArgs = {}): PbEditorPageElementPlugin => {
    const defaultSettings = [
        "pb-editor-page-element-style-settings-tabs",
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

    const elementType = kebabCase(args.elementType || "tabs");

    const defaultToolbar = {
        title: "Tabs",
        group: "pb-editor-element-group-layout",
        preview() {
            return (
                <PreviewBox>
                    <TabsIcon />
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

        target: ["cell", "block"],
        canDelete: () => {
            return true;
        },
        create: () => {
            const defaultValue = {
                type: elementType,
                elements: [createElement("tab"), createElement("tab"), createElement("tab")],
                data: {
                    settings: {
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
            return <Tabs {...props} />;
        }
    };
};

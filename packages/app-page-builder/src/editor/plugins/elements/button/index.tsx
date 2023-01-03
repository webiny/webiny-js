import React from "react";
import { css } from "emotion";
import kebabCase from "lodash/kebabCase";
import {
    DisplayMode,
    PbEditorPageElementPlugin,
    PbEditorPageElementStyleSettingsPlugin,
    PbEditorElementPluginArgs,
    PbEditorElement, PbButtonElementClickHandlerPlugin
} from "~/types";
import { createInitialPerDeviceSettingValue } from "../../elementSettings/elementSettingsUtils";
import ButtonSettings from "./ButtonSettings";
import ButtonSettingsV2 from "./ButtonSettingsV2";
import Button from "./Button";
import {createButton} from "@webiny/app-page-builder-elements/renderers/button";
import {plugins} from "@webiny/plugins";

const buttonWrapper = css({
    display: "flex",
    justifyContent: "center"
});

const buttonElementPluginsFactory = (args: PbEditorElementPluginArgs = {}) => {
    const defaultSettings: string[] = [
        "pb-editor-page-element-style-settings-button-v2",
        "pb-editor-page-element-style-settings-action",
        "pb-editor-page-element-style-settings-horizontal-align-flex",
        "pb-editor-page-element-style-settings-margin",
        "pb-editor-page-element-settings-clone",
        "pb-editor-page-element-settings-delete"
    ];

    const defaultToolbar: PbEditorPageElementPlugin["toolbar"] = {
        title: "Button",
        group: "pb-editor-element-group-basic",
        preview() {
            return (
                <div className={buttonWrapper}>
                    <button className={"webiny-pb-page-element-button"}>Click me</button>
                </div>
            );
        }
    };

    const elementType = kebabCase(args.elementType || "button");

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
                        type: "default",
                        buttonText: "Click me",
                        settings: {
                            margin: createInitialPerDeviceSettingValue(
                                { all: "0px" },
                                DisplayMode.DESKTOP
                            ),
                            horizontalAlignFlex: createInitialPerDeviceSettingValue(
                                "center",
                                DisplayMode.DESKTOP
                            ) as unknown as "flex-start" | "center" | "flex-end"
                        }
                    },
                    ...options
                };

                return typeof args.create === "function" ? args.create(defaultValue) : defaultValue;
            },
            render(props) {
                return <Button {...props} />;
            },
            renderer: createButton({
                clickHandlers: () => {
                    const registeredPlugins = plugins.byType<PbButtonElementClickHandlerPlugin>(
                        "pb-page-element-button-click-handler"
                    );

                    return registeredPlugins.map(plugin => {
                        return {
                            id: plugin.name!,
                            name: plugin.title,
                            handler: plugin.handler,
                            variables: plugin.variables
                        };
                    });
                }
            }),
        } as PbEditorPageElementPlugin,
        {
            name: "pb-editor-page-element-style-settings-button",
            type: "pb-editor-page-element-style-settings",
            render() {
                return <ButtonSettings />;
            }
        } as PbEditorPageElementStyleSettingsPlugin,
        {
            name: "pb-editor-page-element-style-settings-button-v2",
            type: "pb-editor-page-element-style-settings",
            render() {
                return <ButtonSettingsV2 />;
            }
        } as PbEditorPageElementStyleSettingsPlugin
    ];
};

export default buttonElementPluginsFactory;

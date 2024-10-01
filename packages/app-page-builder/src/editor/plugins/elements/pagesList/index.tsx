import React from "react";
import styled from "@emotion/styled";
import kebabCase from "lodash/kebabCase";
import { PluginCollection } from "@webiny/plugins/types";
import {
    PbEditorPageElementPlugin,
    PbEditorPageElementAdvancedSettingsPlugin,
    DisplayMode,
    PbEditorElementPluginArgs,
    OnCreateActions
} from "~/types";
import { createInitialPerDeviceSettingValue } from "../../elementSettings/elementSettingsUtils";
import { ReactComponent as PageListIcon } from "./page-list-icon.svg";
import { PagesList } from "./PagesList";
import PagesListFilterSettings from "./PagesListFilterSettings";
import PagesListDesignSettings from "./PagesListDesignSettings";

export default (args: PbEditorElementPluginArgs = {}): PluginCollection => {
    const PreviewBox = styled("div")({
        textAlign: "center",
        margin: "0 auto",
        width: 100,
        svg: {
            width: 100
        }
    });

    const elementType: string = kebabCase(args.elementType || "pages-list");

    const defaultToolbar = {
        title: "List of pages",
        group: "pb-editor-element-group-basic",
        preview() {
            return (
                <PreviewBox>
                    <PageListIcon />
                </PreviewBox>
            );
        }
    };

    const defaultSettings: string[] = ["pb-editor-page-element-settings-delete"];

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
                        resultsPerPage: 10,
                        component: "default",
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
            render(props) {
                return <PagesList {...props} />;
            }
        } as PbEditorPageElementPlugin,
        {
            name: "pb-editor-page-element-advanced-settings-pages-list-filter",
            type: "pb-editor-page-element-advanced-settings",
            elementType: "pages-list",
            render(props) {
                return <PagesListFilterSettings {...props} />;
            }
        } as PbEditorPageElementAdvancedSettingsPlugin,
        {
            name: "pb-editor-page-element-advanced-settings-pages-list-design",
            type: "pb-editor-page-element-advanced-settings",
            elementType: "pages-list",
            render(props) {
                return <PagesListDesignSettings {...props} />;
            }
        } as PbEditorPageElementAdvancedSettingsPlugin
    ];
};

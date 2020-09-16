//using editor / .. / pageList/index as an example template
//https://github.com/webiny/webiny-js/blob/master/packages/app-page-builder/src/editor/plugins/elements/pagesList/index.tsx
import React from "react";
import {
    PbEditorPageElementPlugin,
    PbEditorPageElementAdvancedSettingsPlugin
} from "@webiny/app-page-builder/types";
import { Tab } from "@webiny/ui/Tabs";
//import { ReactComponent as DesignIcon } from "./icons/round-style-24px.svg";
//import { ReactComponent as FilterIcon } from "./icons/round-filter_list-24px.svg";
import { ReactComponent as MenuIcon } from "./menu-icon.svg";
import Menu from "./Menu";
import MenuFilterSettings from "./MenuFilterSettings";
import MenuDesignSettings from "./MenuDesignSettings";
import styled from "@emotion/styled";

export default () => {
    const PreviewBox = styled("div")({
        textAlign: "center",
        margin: "0 auto",
        width: 100,
        svg: {
            width: 100
        }
    });

    return [
        {
            name: "pb-editor-page-element-menu",
            type: "pb-editor-page-element",
            elementType: "menu",
            toolbar: {
                title: "Menu",
                group: "pb-editor-element-group-form",
                preview() {
                    return (
                        <PreviewBox>
                            <MenuIcon />
                        </PreviewBox>
                    );
                }
            },
            settings: ["pb-editor-page-element-settings-delete"],
            target: ["row", "column"],
            onCreate: "open-settings",
            create(options = {}) {
                return {
                    type: "menu",
                    data: {
                        resultsPerPage: 10,
                        component: "default",
                        settings: {
                            margin: {
                                desktop: { all: 0 },
                                mobile: { all: 0 }
                            },
                            padding: {
                                desktop: { all: 0 },
                                mobile: { all: 0 }
                            }
                        }
                    },
                    ...options
                };
            },
            render({ element }) {
                console.log("OPENING MENU ELEMENT DATA:::::::::::");
                console.log(element.data);
                return <Menu data={element.data} />;
            }
        } as PbEditorPageElementPlugin,
        {
            name: "pb-editor-page-element-advanced-settings-menu-filter",
            type: "pb-editor-page-element-advanced-settings",
            elementType: "menu",
            render(props) {
                return (
                    <Tab icon={<MenuIcon />} label="Filter">
                        <h1>MENU FILTER SETTINGS</h1>
                        <MenuFilterSettings {...props} />
                    </Tab>
                );
            }
        } as PbEditorPageElementAdvancedSettingsPlugin,
        {
            name: "pb-editor-page-element-advanced-settings-menu-design",
            type: "pb-editor-page-element-advanced-settings",
            elementType: "menu",
            render(props) {
                return (
                    <Tab icon={<MenuIcon />} label="Design">
                        <h1>MENU DESIGN SETTINGS</h1>
                        <MenuDesignSettings {...props} />
                    </Tab>
                );
            }
        } as PbEditorPageElementAdvancedSettingsPlugin
    ];
};
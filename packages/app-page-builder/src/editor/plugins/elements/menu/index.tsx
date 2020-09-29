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
//import MenuFilterSettings from "./MenuFilterSettings";
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
            settings: [
                "pb-editor-page-element-settings-delete",
                "",
                "pb-editor-page-element-settings-height"
            ],
            target: ["row", "column", "list-item"],
            onCreate: "open-settings",
            render({ element }) {
                console.log("OPENING MENU ELEMENT DATA:::::::::::");
                console.log("TRY AGAIN!!!")
                console.log(element);
                return <Menu element={element} />;
            },
            create() {
                return {
                    type: "menu",
                    elements: [],
                    data: {},
                    settings: {}
                };
            }
        } as PbEditorPageElementPlugin,
        {
            name: "pb-editor-page-element-advanced-settings-menu-design",
            type: "pb-editor-page-element-advanced-settings",
            elementType: "menu",
            render(props) {
                console.log("PROPS FOR MENU-DESIGN-SETTINGS::::::;;;;;;;;");
                console.log(props);
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
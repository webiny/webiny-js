import React from "react";
import {
    PbEditorPageElementPlugin,
    PbEditorPageElementAdvancedSettingsPlugin
} from "@webiny/app-page-builder/types";
import { Tab } from "@webiny/ui/Tabs";
import { ReactComponent as MenuIcon } from "./menu-icon.svg";
import Menu from "./Menu";
import MenuOptionsSettings from "./MenuOptionsSettings";
import styled from "@emotion/styled";

const PreviewBox = styled("div")({
    textAlign: "center",
    margin: "0 auto",
    width: 100,
    svg: {
        width: 100
    }
});

export default () => {
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
                "pb-editor-page-element-settings-height"
            ],
            target: ["row", "column", "list-item"],
            onCreate: "open-settings",
            render({ element }) {
                return <Menu element={element} />;
            },
            create() {
                return {
                    type: "menu",
                    component: "default",
                    elements: [],
                    data: {
                        component: "default"
                    },
                    settings: {}
                };
            }
        } as PbEditorPageElementPlugin,
        {
            name: "pb-editor-page-element-advanced-settings-menu-design",
            type: "pb-editor-page-element-advanced-settings",
            elementType: "menu",
            render(props) {
                return (
                    <Tab icon={<MenuIcon />} label="Design">
                        <MenuOptionsSettings {...props} />
                    </Tab>
                );
            }
        } as PbEditorPageElementAdvancedSettingsPlugin
    ];
};
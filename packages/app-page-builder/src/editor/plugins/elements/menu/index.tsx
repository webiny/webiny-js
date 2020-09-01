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
//import { ReactComponent as MenuIcon } from "./menu-icon.svg";
import Menu from "./Menu";
//import PagesListFilterSettings from "./PagesListFilterSettings";
//import PagesListDesignSettings from "./PagesListDesignSettings";
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
                group: "pb-editor-element-group-basic",
                preview() {
                    return (
                        <PreviewBox>
                            <Menu />
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
                return <Menu data={element.data} />;
            }
        } as PbEditorPageElementPlugin,
        {
            name: "pb-editor-page-element-advanced-settings-menu-filter",
            type: "pb-editor-page-element-advanced-settings",
            elementType: "pages-list",
            render(props) {
                return (
                    <Tab icon={<FilterIcon />} label="Filter">
                        <MenuFilterSettings {...props} />
                    </Tab>
                );
            }
        } as PbEditorPageElementAdvancedSettingsPlugin,
        {
            name: "pb-editor-page-element-advanced-settings-pages-list-design",
            type: "pb-editor-page-element-advanced-settings",
            elementType: "pages-list",
            render(props) {
                return (
                    <Tab icon={<DesignIcon />} label="Design">
                        <PagesListDesignSettings {...props} />
                    </Tab>
                );
            }
        } as PbEditorPageElementAdvancedSettingsPlugin
    ];
};

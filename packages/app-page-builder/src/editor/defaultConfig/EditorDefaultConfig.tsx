import React from "react";
import { ResponsiveModeSelector } from "./TopBar/ResponsiveModeSelector";
import { Breadcrumbs } from "./Content/Breadcrumbs";
import { Background } from "./Content/Background";
import { Elements } from "./Content/Elements";
import { ActionPlugins } from "./ActionPlugins";
import { EditorConfig } from "~/editor/config";
import { AddElement } from "~/editor/defaultConfig/Toolbar/AddElement";

const { TopBar, Content, Toolbar } = EditorConfig;

export const EditorDefaultConfig = React.memo(() => {
    return (
        <>
            <ActionPlugins />
            <EditorConfig>
                <TopBar.Element
                    name={"responsiveModeSelector"}
                    group={"center"}
                    element={<ResponsiveModeSelector />}
                />
                <Content.Element name={"breadcrumbs"} element={<Breadcrumbs />} />
                <Content.Element name={"background"} element={<Background />} />
                <Content.Element name={"elements"} element={<Elements />} />
                <Toolbar.Element name={"addElement"} group={"top"} element={<AddElement />} />
            </EditorConfig>
        </>
    );
});

EditorDefaultConfig.displayName = "EditorDefaultConfig";

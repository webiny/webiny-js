import React from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { TopBar } from "./TopBar/TopBar";
import { Content } from "./Content/Content";
import { Toolbar } from "./Toolbar/Toolbar";
import { Sidebar } from "./Sidebar/Sidebar";
import { EditorConfig } from "~/editor/config/EditorConfig";

export const Layout = makeDecoratable("EditorLayout", () => {
    return (
        <>
            <EditorConfig.Elements group={"overlays"} />
            <TopBar />
            <Toolbar />
            <Content />
            <Sidebar />
        </>
    );
});

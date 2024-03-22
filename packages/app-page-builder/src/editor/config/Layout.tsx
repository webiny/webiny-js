import React from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { EditorSidebar } from "~/editor/components/Editor/EditorSidebar";
import { TopBar } from "./TopBar/TopBar";
import { Content } from "./Content/Content";
import { Toolbar } from "./Toolbar/Toolbar";

export const Layout = makeDecoratable("EditorLayout", () => {
    return (
        <>
            <TopBar />
            <Toolbar />
            <Content />
            <EditorSidebar />
        </>
    );
});

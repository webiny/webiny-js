import React from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { EditorConfig } from "~/editor/config/EditorConfig";

export const Layout = makeDecoratable("EditorLayout", () => {
    return (
        <>
            <EditorConfig.TopBar />
            <EditorConfig.Toolbar />
            <EditorConfig.Content />
            <EditorConfig.Sidebar />
            <EditorConfig.Elements group={"overlays"} />
        </>
    );
});

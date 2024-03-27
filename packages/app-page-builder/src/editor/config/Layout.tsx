import React from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { EditorConfig } from "~/editor/config/EditorConfig";

export const Layout = makeDecoratable("EditorLayout", () => {
    return (
        <>
            <EditorConfig.Ui.TopBar />
            <EditorConfig.Ui.Toolbar />
            <EditorConfig.Ui.Content />
            <EditorConfig.Ui.Sidebar />
            <EditorConfig.Ui.Elements group={"overlays"} />
        </>
    );
});

import React from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { TopBar } from "./TopBar/TopBar";
import { Content } from "./Content/Content";
import { Toolbar } from "./Toolbar/Toolbar";
import { Sidebar } from "./Sidebar/Sidebar";

export const Layout = makeDecoratable("EditorLayout", () => {
    return (
        <>
            <TopBar />
            <Toolbar />
            <Content />
            <Sidebar />
        </>
    );
});

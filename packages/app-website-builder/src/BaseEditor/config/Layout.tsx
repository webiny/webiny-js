import React, { useEffect } from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { EditorConfig } from "./EditorConfig.js";
import styled from "@emotion/styled";

const EditorLayoutContainer = styled.div`
    background-color: #f2f2f2;
    height: 100%;
    overflow: hidden;
`;

export const Layout = makeDecoratable("EditorLayout", () => {
    useEffect(() => {
        const currentOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = currentOverflow;
        };
    }, []);

    return (
        <EditorLayoutContainer>
            <EditorConfig.Ui.TopBar />
            <div className={"flex flex-row"}>
                <EditorConfig.Ui.Toolbar />
                <div className={"flex-auto"}>
                    <EditorConfig.Ui.Content />
                </div>
                <EditorConfig.Ui.Sidebar />
            </div>
            <EditorConfig.Ui.Elements group={"overlays"} />
        </EditorLayoutContainer>
    );
});

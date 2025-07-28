import React, { useEffect } from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { EditorConfig } from "./EditorConfig";
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
            <div className={"wby-flex wby-flex-row"}>
                <div className={"wby-w-[300px] wby-flex-none"}>
                    <EditorConfig.Ui.Toolbar />
                </div>
                <div className={"wby-flex-auto"}>
                    <EditorConfig.Ui.Content />
                </div>
                <div className={"wby-w-[300px] wby-flex-none"}>
                    <EditorConfig.Ui.Sidebar />
                </div>
            </div>
            <EditorConfig.Ui.Elements group={"overlays"} />
        </EditorLayoutContainer>
    );
});

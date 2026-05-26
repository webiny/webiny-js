import React, { useEffect } from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { EditorConfig } from "./EditorConfig.js";
import styled from "@emotion/styled";
import { IsNotReadOnly } from "~/BaseEditor/config/IsNotReadOnly.js";
import { useReservedUISpace } from "~/BaseEditor/hooks/useReservedUISpace.js";
import { useDocumentEditor } from "~/DocumentEditor/index.js";

const EditorLayoutContainer = styled.div`
    height: 100%;
    overflow: hidden;
`;

export const Layout = makeDecoratable("EditorLayout", () => {
    const editor = useDocumentEditor();

    useReservedUISpace(dimensions => {
        editor.updateEditor(state => {
            state.uiReservedSpace = dimensions;
        });
    });

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
                <IsNotReadOnly>
                    <EditorConfig.Ui.Toolbar />
                </IsNotReadOnly>
                <div className={"flex-auto"}>
                    <EditorConfig.Ui.Content />
                </div>
                <IsNotReadOnly>
                    <EditorConfig.Ui.Sidebar />
                </IsNotReadOnly>
            </div>
            <EditorConfig.Ui.Elements group={"overlays"} />
        </EditorLayoutContainer>
    );
});

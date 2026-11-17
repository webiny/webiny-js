import React, { useEffect } from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { EditorConfig } from "./EditorConfig.js";
import styled from "@emotion/styled";
import { useReservedUISpace } from "~/BaseEditor/hooks/useReservedUISpace.js";
import { useDocumentEditor } from "~/DocumentEditor/index.js";

// The editor takes the whole window: the body does not scroll while it is open (see below).
const EditorLayoutContainer = styled.div`
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
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
            {/*
             * The rest of the window, so a panel's long content scrolls inside it rather than
             * stretching the row past the window and pushing the breadcrumb bar out of view.
             */}
            <div className={"flex min-h-0 flex-1 flex-row"}>
                <EditorConfig.Ui.Panels side={"left"} />
                {/* `relative`: the breadcrumb bar sits at its foot, as wide as the panels leave it. */}
                <div className={"relative flex-auto"}>
                    <EditorConfig.Ui.Content />
                </div>
                <EditorConfig.Ui.Panels />
            </div>
            <EditorConfig.Ui.Elements group={"overlays"} />
        </EditorLayoutContainer>
    );
});

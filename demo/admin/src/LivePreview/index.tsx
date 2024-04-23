import { ContentEntryEditorConfig } from "@webiny/app-headless-cms";
import React from "react";
import { AddPreviewPane, DecorateUseContentEntryForm } from "./AddPreviewPane";

export const LivePreview = () => {
    return (
        <>
            <AddPreviewPane />
            <ContentEntryEditorConfig>
                <DecorateUseContentEntryForm />
            </ContentEntryEditorConfig>
        </>
    );
};

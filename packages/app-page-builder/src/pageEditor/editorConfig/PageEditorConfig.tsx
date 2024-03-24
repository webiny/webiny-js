import React from "react";
import { CompositionScope } from "@webiny/app-admin";
import { EditorConfig } from "~/editor/config";

interface PageEditorConfigProps {
    children: React.ReactNode;
}

const BasePageEditorConfig = ({ children }: PageEditorConfigProps) => {
    return (
        <CompositionScope name={"pb.pageEditor"}>
            <EditorConfig>{children}</EditorConfig>
        </CompositionScope>
    );
};

export const PageEditorConfig = Object.assign(BasePageEditorConfig, EditorConfig);

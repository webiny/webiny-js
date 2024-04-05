import React from "react";
import { CompositionScope } from "@webiny/app-admin";
import { EditorConfig } from "~/editor/config";

interface BlockEditorConfigProps {
    children: React.ReactNode;
}

const BaseBlockEditorConfig = ({ children }: BlockEditorConfigProps) => {
    return (
        <CompositionScope name={"pb.blockEditor"}>
            <EditorConfig priority={"secondary"}>{children}</EditorConfig>
        </CompositionScope>
    );
};

export const BlockEditorConfig = Object.assign(BaseBlockEditorConfig, EditorConfig);

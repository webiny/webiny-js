import React from "react";
import { CompositionScope } from "@webiny/app-admin";
import { EditorConfig } from "~/editor/config";

interface TemplateEditorConfigProps {
    children: React.ReactNode;
}

const BaseTemplateEditorConfig = ({ children }: TemplateEditorConfigProps) => {
    return (
        <CompositionScope name={"pb.templateEditor"}>
            <EditorConfig priority={"secondary"}>{children}</EditorConfig>
        </CompositionScope>
    );
};

export const TemplateEditorConfig = Object.assign(BaseTemplateEditorConfig, EditorConfig);

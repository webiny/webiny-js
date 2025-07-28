import React from "react";
import { CompositionScope } from "@webiny/app-admin";
import { EditorConfig } from "~/BaseEditor";
import { EDITOR_NAME } from "~/modules/pages/constants";

interface PageEditorConfigProps {
    children: React.ReactNode;
}

const BasePageEditorConfig = ({ children }: PageEditorConfigProps) => {
    return (
        <CompositionScope name={EDITOR_NAME} inherit={true}>
            <EditorConfig priority={"secondary"}>{children}</EditorConfig>
        </CompositionScope>
    );
};

export const PageEditorConfig = Object.assign(BasePageEditorConfig, EditorConfig);

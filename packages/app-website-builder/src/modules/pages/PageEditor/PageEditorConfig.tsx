import React from "react";
import { CompositionScope } from "@webiny/app-admin";
import { EditorConfig, EditorConfigComponents } from "~/BaseEditor/index.js";
import { EDITOR_NAME } from "~/modules/pages/constants.js";

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

export const PageEditorConfig = Object.assign(BasePageEditorConfig, EditorConfigComponents);

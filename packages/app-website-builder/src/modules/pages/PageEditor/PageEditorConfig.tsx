import React from "react";
import { CompositionScope } from "@webiny/app-admin";
import { EditorConfig, EditorConfigComponents } from "~/BaseEditor/index.js";
import { EDITOR_NAME } from "~/modules/pages/constants.js";

interface PageEditorConfigProps {
    children: React.ReactNode;
}

const PrimaryPageEditorConfig = ({ children }: PageEditorConfigProps) => {
    return (
        <CompositionScope name={EDITOR_NAME} inherit={true}>
            <EditorConfig priority={"primary"}>{children}</EditorConfig>
        </CompositionScope>
    );
};

const SecondaryPageEditorConfig = ({ children }: PageEditorConfigProps) => {
    return (
        <CompositionScope name={EDITOR_NAME} inherit={true}>
            <EditorConfig priority={"secondary"}>{children}</EditorConfig>
        </CompositionScope>
    );
};

/* This one is an internal API for the base app. It ensures this config is always applied first. */
export const InternalPageEditorConfig = Object.assign(
    PrimaryPageEditorConfig,
    EditorConfigComponents
);

/* This one is a public API for other apps and third party developers. */
export const PageEditorConfig = Object.assign(SecondaryPageEditorConfig, EditorConfigComponents);

import React from "react";
import { CompositionScope } from "@webiny/app-admin";
import { EditorConfig, EditorConfigComponents } from "~/BaseEditor/index.js";
import { LAYOUT_EDITOR_NAME } from "../constants.js";

interface LayoutEditorConfigProps {
    children: React.ReactNode;
}

const PrimaryLayoutEditorConfig = ({ children }: LayoutEditorConfigProps) => {
    return (
        <CompositionScope name={LAYOUT_EDITOR_NAME} inherit={true}>
            <EditorConfig priority={"primary"}>{children}</EditorConfig>
        </CompositionScope>
    );
};

const SecondaryLayoutEditorConfig = ({ children }: LayoutEditorConfigProps) => {
    return (
        <CompositionScope name={LAYOUT_EDITOR_NAME} inherit={true}>
            <EditorConfig priority={"secondary"}>{children}</EditorConfig>
        </CompositionScope>
    );
};

/* This one is an internal API for the base app. It ensures this config is always applied first. */
export const InternalLayoutEditorConfig = Object.assign(
    PrimaryLayoutEditorConfig,
    EditorConfigComponents
);

/* This one is a public API for other apps and third party developers. */
export const LayoutEditorConfig = Object.assign(
    SecondaryLayoutEditorConfig,
    EditorConfigComponents
);

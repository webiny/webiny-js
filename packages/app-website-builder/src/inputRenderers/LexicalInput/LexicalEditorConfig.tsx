import React from "react";
import {
    FloatingToolbar as BaseFloatingToolbar,
    LexicalEditorConfig as BaseConfig,
    StaticToolbar as BaseStaticToolbar
} from "@webiny/lexical-editor";
import { CompositionScope } from "@webiny/react-composition";
import { CompactToolbar, ExpandedToolbar } from "./toolbars.js";
import "./wbStaticToolbar.css";
import "./wbFloatingToolbar.css";

const ToolbarAction = (props: React.ComponentProps<typeof BaseConfig.ToolbarElement>) => {
    return <BaseConfig.ToolbarElement {...props} />;
};

const PluginConfig = (props: React.ComponentProps<typeof BaseConfig.Plugin>) => {
    return <BaseConfig.Plugin {...props} />;
};

const NodeConfig = (props: React.ComponentProps<typeof BaseConfig.Node>) => {
    return <BaseConfig.Node {...props} />;
};

export const CompactEditorConfig = ({ children }: { children: React.ReactNode }) => {
    return (
        <CompositionScope name={"compact"}>
            <BaseConfig priority={"secondary"}>{children}</BaseConfig>
        </CompositionScope>
    );
};

CompactEditorConfig.ToolbarAction = ToolbarAction;
CompactEditorConfig.Plugin = PluginConfig;
CompactEditorConfig.Node = NodeConfig;
CompactEditorConfig.Toolbar = CompactToolbar;

export const ExpandedEditorConfig = ({ children }: { children: React.ReactNode }) => {
    return (
        <CompositionScope name={"expanded"}>
            <BaseConfig priority={"secondary"}>{children}</BaseConfig>
        </CompositionScope>
    );
};

ExpandedEditorConfig.ToolbarAction = ToolbarAction;
ExpandedEditorConfig.Plugin = PluginConfig;
ExpandedEditorConfig.Node = NodeConfig;
ExpandedEditorConfig.Toolbar = ExpandedToolbar;

interface ScopeProps {
    /** The scope's name; an editor reads it with `<LexicalEditor scope={name} />`. */
    name: string;
    children: React.ReactNode;
}

/**
 * Config for the editors of one scope: a toolbar container with its contents, e.g.
 * `<FloatingToolbar><Expanded.Toolbar /></FloatingToolbar>`. Config in a scope replaces the
 * admin's global Lexical config there.
 */
const ScopeConfig = ({ name, children }: ScopeProps) => {
    return <CompositionScope name={name}>{children}</CompositionScope>;
};

interface ToolbarContainerProps {
    /** The toolbar's contents, e.g. `<LexicalEditorConfig.Expanded.Toolbar />`. */
    children?: React.ReactNode;
}

/** The toolbar as a band above the text, as the page editor's inputs have it. */
export const StaticToolbarContainer = ({ children }: ToolbarContainerProps) => {
    return (
        <>
            <BaseConfig priority={"primary"}>
                <BaseConfig.ToolbarContainer
                    type={"static"}
                    element={<BaseStaticToolbar className={"wb-static-toolbar"} />}
                />
            </BaseConfig>
            {children}
        </>
    );
};

/** The toolbar as a panel over the selected text, for form-like editors. */
export const FloatingToolbarContainer = ({ children }: ToolbarContainerProps) => {
    return (
        <>
            <BaseConfig priority={"primary"}>
                <BaseConfig.ToolbarContainer
                    type={"floating"}
                    element={
                        <BaseFloatingToolbar className={"wb-static-toolbar wb-floating-toolbar"} />
                    }
                />
            </BaseConfig>
            {children}
        </>
    );
};

export const LexicalEditorConfig = {
    Expanded: ExpandedEditorConfig,
    Compact: CompactEditorConfig,
    Scope: ScopeConfig,
    StaticToolbar: StaticToolbarContainer,
    FloatingToolbar: FloatingToolbarContainer
};

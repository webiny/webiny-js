import React from "react";
import { LexicalEditorConfig as BaseConfig } from "@webiny/lexical-editor";
import { CompositionScope } from "@webiny/react-composition";

const ToolbarAction = (props: React.ComponentProps<typeof BaseConfig.ToolbarElement>) => {
    return <BaseConfig.ToolbarElement {...props} />;
};

const PluginConfig = (props: React.ComponentProps<typeof BaseConfig.Plugin>) => {
    return <BaseConfig.Plugin {...props} />;
};

const NodeConfig = (props: React.ComponentProps<typeof BaseConfig.Node>) => {
    return <BaseConfig.Node {...props} />;
};

/*
 * Lexical editor public Config API
 */
export const LexicalEditorConfig = ({ children }: { children: React.ReactNode }) => {
    return (
        <CompositionScope name={"cms"}>
            <BaseConfig>{children}</BaseConfig>
        </CompositionScope>
    );
};

LexicalEditorConfig.ToolbarAction = ToolbarAction;
LexicalEditorConfig.Plugin = PluginConfig;
LexicalEditorConfig.Node = NodeConfig;

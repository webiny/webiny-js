import React from "react";
import { LexicalEditorConfig as BaseConfig } from "@webiny/lexical-editor";
import { CompositionScope } from "@webiny/react-composition";

const ToolbarAction = (props: React.ComponentProps<typeof BaseConfig.ToolbarElement>) => {
    return (
        <CompositionScope name={"cms"}>
            <BaseConfig>
                <BaseConfig.ToolbarElement {...props} />
            </BaseConfig>
        </CompositionScope>
    );
};

const PluginConfig = (props: React.ComponentProps<typeof BaseConfig.ToolbarElement>) => {
    return (
        <CompositionScope name={"cms"}>
            <BaseConfig>
                <BaseConfig.Plugin {...props} />
            </BaseConfig>
        </CompositionScope>
    );
};

const NodeConfig = (props: React.ComponentProps<typeof BaseConfig.ToolbarElement>) => {
    return (
        <CompositionScope name={"cms"}>
            <BaseConfig>
                <BaseConfig.Node {...props} />
            </BaseConfig>
        </CompositionScope>
    );
};

/*
 * Lexical editor public Config API
 */
export const LexicalEditorConfig = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
};

LexicalEditorConfig.ToolbarAction = ToolbarAction;
LexicalEditorConfig.Plugin = PluginConfig;
LexicalEditorConfig.Node = NodeConfig;

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

import { useMemo } from "react";
import { createConfigurableComponent } from "@webiny/react-properties";
import type { ToolbarElementConfig } from "./components/ToolbarElement.js";
import { ToolbarElement } from "./components/ToolbarElement.js";
import type { PluginConfig } from "./components/Plugin.js";
import { Plugin } from "./components/Plugin.js";
import type { NodeConfig } from "./components/Node.js";
import { Node } from "./components/Node.js";

export type { ToolbarElementConfig } from "./components/ToolbarElement.js";
export type { PluginConfig } from "./components/Plugin.js";
export type { NodeConfig } from "./components/Node.js";

const base = createConfigurableComponent<LexicalEditorConfigData>("LexicalEditor");

export const LexicalEditorConfig = Object.assign(base.Config, {
    ToolbarElement,
    Plugin,
    Node
});

export const LexicalEditorWithConfig = base.WithConfig;

interface LexicalEditorConfigData {
    toolbarElements: ToolbarElementConfig[];
    plugins: PluginConfig[];
    nodes: NodeConfig[];
}

export function useLexicalEditorConfig(): LexicalEditorConfigData {
    const config = base.useConfig();
    const toolbarElements = config.toolbarElements || [];
    const plugins = config.plugins || [];
    const nodes = config.nodes || [];

    return useMemo(
        () => ({
            toolbarElements: [...toolbarElements],
            plugins: [...plugins],
            nodes: [...nodes]
        }),
        [config]
    );
}

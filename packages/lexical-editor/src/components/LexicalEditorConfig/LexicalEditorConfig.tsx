import React, { useContext, useMemo, useState } from "react";
import type { Decorator, GenericComponent } from "@webiny/react-composition";
import { makeDecoratable, Compose } from "@webiny/react-composition";
import type { Property } from "@webiny/react-properties";
import { Properties, toObject } from "@webiny/react-properties";
import type { ToolbarElementConfig } from "./components/ToolbarElement.js";
import { ToolbarElement } from "./components/ToolbarElement.js";
import type { PluginConfig } from "./components/Plugin.js";
import { Plugin } from "./components/Plugin.js";
import type { NodeConfig } from "./components/Node.js";
import { Node } from "./components/Node.js";
import { DebounceRenderer } from "../Editor/DebounceRender.js";

const LexicalEditorConfigApply = makeDecoratable("LexicalEditorConfigApply", ({ children }) => {
    return <>{children}</>;
});

const createHOC =
    (newChildren: React.ReactNode): Decorator<GenericComponent> =>
    BaseComponent => {
        return function ConfigHOC({ children }) {
            return (
                <BaseComponent>
                    {newChildren}
                    {children}
                </BaseComponent>
            );
        };
    };

export const LexicalEditorConfig = ({ children }: { children: React.ReactNode }) => {
    return <Compose component={LexicalEditorConfigApply} with={createHOC(children)} />;
};

LexicalEditorConfig.ToolbarElement = ToolbarElement;
LexicalEditorConfig.Plugin = Plugin;
LexicalEditorConfig.Node = Node;

interface ViewContext {
    properties: Property[];
}

const ViewContext = React.createContext<ViewContext>({ properties: [] });

export const LexicalEditorWithConfig = ({ children }: { children: React.ReactNode }) => {
    const [properties, setProperties] = useState<Property[]>([]);

    const stateUpdater = (properties: Property[]) => {
        setProperties(properties);
    };

    return (
        <ViewContext.Provider value={{ properties }}>
            <Properties onChange={stateUpdater}>
                <LexicalEditorConfigApply />
                <DebounceRenderer>{children}</DebounceRenderer>
            </Properties>
        </ViewContext.Provider>
    );
};

interface LexicalEditorConfigData {
    toolbarElements: ToolbarElementConfig[];
    plugins: PluginConfig[];
    nodes: NodeConfig[];
}

export function useLexicalEditorConfig() {
    const { properties } = useContext(ViewContext);

    const config = useMemo(() => {
        return toObject<LexicalEditorConfigData>(properties);
    }, [properties]);

    return {
        toolbarElements: config.toolbarElements || [],
        plugins: config.plugins || [],
        nodes: config.nodes || []
    };
}

import React, { useContext, useMemo, useState } from "react";
import {
    makeDecoratable,
    Compose,
    GenericDecorator,
    GenericComponent
} from "@webiny/react-composition";
import { Property, Properties, toObject } from "@webiny/react-properties";
import { ToolbarElement, ToolbarElementConfig } from "./components/ToolbarElement";
import { Plugin, PluginConfig } from "./components/Plugin";
import { Node, NodeConfig } from "./components/Node";

const LexicalEditorConfigApply = makeDecoratable("LexicalEditorConfigApply", ({ children }) => {
    return <>{children}</>;
});

const createHOC =
    (newChildren: React.ReactNode): GenericDecorator<GenericComponent> =>
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
    const context = { properties };

    const stateUpdater = (properties: Property[]) => {
        setProperties(properties);
    };

    return (
        <ViewContext.Provider value={context}>
            <Properties onChange={stateUpdater}>
                <LexicalEditorConfigApply />
                {children}
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

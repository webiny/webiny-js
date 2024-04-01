import { createConfigurableComponent } from "@webiny/react-properties";
import { Element, ElementConfig } from "./Element";
import { TopBar } from "./TopBar/TopBar";
import { Layout } from "./Layout";
import { Content } from "./Content/Content";
import { Toolbar } from "./Toolbar/Toolbar";
import { Sidebar } from "./Sidebar/Sidebar";
import { Elements } from "~/editor/config/Elements";
import { OnActiveElement } from "./OnActiveElement";
import { NoActiveElement } from "./NoActiveElement";
import { ElementProperties, ElementProperty } from "./ElementProperty";
import { ElementAction } from "./ElementAction";

const base = createConfigurableComponent<ContentEntryEditorConfig>("PageBuilderEditorConfig");

export const EditorConfig = Object.assign(base.Config, {
    /**
     * Components to configure editor UI.
     */
    Ui: {
        Element,
        Elements,
        Layout,
        Content,
        TopBar,
        Toolbar,
        Sidebar,
        OnActiveElement,
        NoActiveElement
    },
    /**
     * Define a new element property.
     */
    ElementProperty,
    /**
     * Render element properties for the given group.
     */
    ElementProperties,
    /**
     * Define an element action.
     */
    ElementAction,
    useEditorConfig
});

export const EditorWithConfig = Object.assign(base.WithConfig, { displayName: "EditorWithConfig" });

interface ContentEntryEditorConfig {
    elements: ElementConfig[];
}

export function useEditorConfig() {
    const config = base.useConfig();

    return { elements: config.elements || [] };
}

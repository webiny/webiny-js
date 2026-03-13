import { createConfigurableComponent } from "@webiny/react-properties";
import type { ElementConfig } from "./Element.js";
import { Element } from "./Element.js";
import { TopBar } from "./TopBar/TopBar.js";
import { Layout } from "./Layout.js";
import { Content } from "./Content/Content.js";
import { Toolbar } from "./Toolbar/Toolbar.js";
import { Sidebar } from "./Sidebar/Sidebar.js";
import { Elements } from "./Elements.js";
import { OnActiveElement } from "./OnActiveElement.js";
import { NoActiveElement } from "./NoActiveElement.js";
import { ElementProperties, ElementProperty } from "./ElementProperty.js";
import { ElementAction, ElementActions } from "./ElementAction.js";
import type { ElementInputConfig } from "./ElementInput.js";
import { ElementInput } from "./ElementInput.js";
import { IsNotReadOnly } from "~/BaseEditor/config/IsNotReadOnly.js";
import { IsReadOnly } from "~/BaseEditor/config/IsReadOnly.js";

interface EditorConfig {
    elements: ElementConfig[];
    inputRenderers: ElementInputConfig[];
}

const base = createConfigurableComponent<EditorConfig>("DocumentEditor");

export const EditorConfigComponents = {
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
        IsReadOnly,
        IsNotReadOnly,
        OnActiveElement,
        NoActiveElement
    },
    ElementInput,
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
    /**
     * Render all element actions.
     */
    ElementActions,
    /**
     * Access full editor config. WARNING: very low-level, we don't recommend using this directly!
     */
    useEditorConfig
};

export const EditorConfig = Object.assign(base.Config, EditorConfigComponents);

export const EditorWithConfig = Object.assign(base.WithConfig, { displayName: "EditorWithConfig" });

export function useEditorConfig() {
    const config = base.useConfig();

    return { elements: config.elements || [], inputRenderers: config.inputRenderers || [] };
}

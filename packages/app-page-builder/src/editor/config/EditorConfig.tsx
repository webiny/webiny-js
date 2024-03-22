import { createConfigurableComponent } from "@webiny/react-properties";
import { Element, ElementConfig } from "./Element";
import { TopBar } from "./TopBar/TopBar";
import { Layout } from "./Layout";
import { Content } from "./Content/Content";
import { Toolbar } from "./Toolbar/Toolbar";

const base = createConfigurableComponent<ContentEntryEditorConfig>("PageBuilderEditorConfig");

export const EditorConfig = Object.assign(base.Config, {
    Element,
    Layout,
    Content,
    TopBar,
    Toolbar,
    useEditorConfig
});

export const EditorWithConfig = base.WithConfig;

interface ContentEntryEditorConfig {
    elements: ElementConfig[];
}

export function useEditorConfig() {
    const config = base.useConfig();

    return { elements: config.elements || [] };
}

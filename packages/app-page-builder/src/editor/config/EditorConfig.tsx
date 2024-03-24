import { createConfigurableComponent } from "@webiny/react-properties";
import { Element, ElementConfig } from "./Element";
import { TopBar } from "./TopBar/TopBar";
import { Layout } from "./Layout";
import { Content } from "./Content/Content";
import { Toolbar } from "./Toolbar/Toolbar";
import { Sidebar } from "./Sidebar/Sidebar";
import { Elements } from "~/editor/config/Elements";

const base = createConfigurableComponent<ContentEntryEditorConfig>("PageBuilderEditorConfig");

export const EditorConfig = Object.assign(base.Config, {
    Element,
    Elements,
    Layout,
    Content,
    TopBar,
    Toolbar,
    Sidebar,
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

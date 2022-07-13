import { PluginsAtomType } from "./plugins";
import { ActiveElementAtomType, HighlightElementAtomType, SidebarAtomType, UiAtomType } from "./ui";
import { PbEditorElement } from "~/types";

export type PbState<TState = unknown> = {
    activeElement?: ActiveElementAtomType;
    highlightElement?: HighlightElementAtomType;
    elements?: { [id: string]: PbEditorElement };
    plugins: PluginsAtomType;
    ui: UiAtomType;
    rootElement: string;
    sidebar: SidebarAtomType;
} & TState;

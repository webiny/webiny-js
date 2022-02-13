import { PageAtomType } from "./page";
import { PluginsAtomType } from "./plugins";
import { RevisionsAtomType } from "./revisions";
import { ActiveElementAtomType, HighlightElementAtomType, SidebarAtomType, UiAtomType } from "./ui";
import { PbEditorElement } from "~/types";

export type PbState = {
    activeElement?: ActiveElementAtomType;
    highlightElement?: HighlightElementAtomType;
    elements?: { [id: string]: PbEditorElement };
    page: PageAtomType;
    plugins: PluginsAtomType;
    ui: UiAtomType;
    rootElement: string;
    revisions: RevisionsAtomType;
    sidebar: SidebarAtomType;
};

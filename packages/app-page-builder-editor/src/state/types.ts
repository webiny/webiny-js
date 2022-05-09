import { PageAtomType } from "./page";
import { RevisionsAtomType } from "./revisions";
import { ActiveElementAtomType, HighlightElementAtomType, SidebarAtomType, UiAtomType } from "./ui";
import { PbEditorElement } from "~/types";

export type PbState = {
    activeElement?: ActiveElementAtomType;
    highlightElement?: HighlightElementAtomType;
    elements?: { [id: string]: PbEditorElement };
    page: PageAtomType;
    ui: UiAtomType;
    rootElement: string;
    revisions: RevisionsAtomType;
    sidebar: SidebarAtomType;
};

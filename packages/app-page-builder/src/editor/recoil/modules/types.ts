import { PageAtomType } from "@webiny/app-page-builder/editor/recoil/modules/page";
import { PluginsAtomType } from "@webiny/app-page-builder/editor/recoil/modules/plugins";
import { RevisionsAtomType } from "@webiny/app-page-builder/editor/recoil/modules/revisions";
import {
    ActiveElementAtomType,
    HighlightElementAtomType,
    SidebarAtomType,
    UiAtomType
} from "@webiny/app-page-builder/editor/recoil/modules/ui";
import { PbElement } from "@webiny/app-page-builder/types";

export type PbState = {
    activeElement?: ActiveElementAtomType;
    highlightElement?: HighlightElementAtomType;
    elements?: { [id: string]: PbElement };
    page: PageAtomType;
    plugins: PluginsAtomType;
    ui: UiAtomType;
    rootElement: string;
    revisions: RevisionsAtomType;
    sidebar: SidebarAtomType;
};

import { ContentAtomType } from "@webiny/app-page-builder/editor/recoil/modules/content";
import { ElementsAtomType } from "@webiny/app-page-builder/editor/recoil/modules/elements";
import { PageAtomType } from "@webiny/app-page-builder/editor/recoil/modules/page";
import { PluginsAtomType } from "@webiny/app-page-builder/editor/recoil/modules/plugins";
import { RevisionsAtomType } from "@webiny/app-page-builder/editor/recoil/modules/revisions";
import {
    ActiveElementAtomType,
    HighlightElementAtomType,
    SidebarAtomType,
    UiAtomType
} from "@webiny/app-page-builder/editor/recoil/modules/ui";

export type PbState = {
    activeElement: ActiveElementAtomType;
    highlightElement: HighlightElementAtomType;
    elements: ElementsAtomType;
    page: PageAtomType;
    plugins: PluginsAtomType;
    ui: UiAtomType;
    content: ContentAtomType;
    revisions: RevisionsAtomType;
    sidebar: SidebarAtomType;
};

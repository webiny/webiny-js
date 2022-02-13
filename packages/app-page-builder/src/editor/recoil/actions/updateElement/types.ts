import { PbEditorElement } from "~/types";
import { SaveRevisionActionArgsType } from "~/editor/recoil/actions/saveRevision/types";

export interface UpdateElementActionArgsType extends SaveRevisionActionArgsType {
    element: PbEditorElement;
    history: boolean;
    triggerUpdateElementTree?: boolean;
}

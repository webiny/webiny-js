import { PbEditorElement } from "~/types";
import { SaveRevisionActionArgsType } from "~/editor/recoil/actions/saveRevision/types";

export type UpdateElementActionArgsType = SaveRevisionActionArgsType & {
    element: PbEditorElement;
    history: boolean;
    triggerUpdateElementTree?: boolean;
};

import { PbEditorElement } from "~/types";

export interface UpdateElementActionArgsType {
    element: PbEditorElement;
    history: boolean;
    triggerUpdateElementTree?: boolean;
    debounce?: boolean;
    onFinish?: () => void;
}

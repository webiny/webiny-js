import { UpdateDocumentActionEvent } from "~/editor/recoil/actions/updateDocument";
import { CreateElementEventActionArgsType } from "./types";
import { EventActionCallable } from "~/types";

export const createElementAction: EventActionCallable<CreateElementEventActionArgsType> = () => {
    return {
        actions: [new UpdateDocumentActionEvent()]
    };
};

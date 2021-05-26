import { CreateElementEventActionArgsType } from "./types";
import { EventActionCallable } from "~/types";
import { UpdateElementTreeActionEvent } from "../updateElementTree";

export const createElementAction: EventActionCallable<CreateElementEventActionArgsType> = () => {
    return {
        actions: [new UpdateElementTreeActionEvent()]
    };
};

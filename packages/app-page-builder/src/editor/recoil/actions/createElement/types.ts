import { EventActionCallableType } from "@webiny/app-page-builder/editor/recoil/eventActions";
import { PbElement } from "@webiny/app-page-builder/types";

export type CreateElementEventActionArgsType = {
    element: PbElement;
    source: PbElement;
};
export type CreateElementEventActionCallableType = EventActionCallableType<
    CreateElementEventActionArgsType
>;

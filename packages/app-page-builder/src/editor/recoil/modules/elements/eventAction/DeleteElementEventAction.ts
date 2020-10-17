import { BaseEventAction } from "@webiny/app-page-builder/editor/recoil/eventActions";
import { PbElement } from "@webiny/app-page-builder/types";

type DeleteElementEventActionArgsType = {
    element: PbElement;
};
export class DeleteElementEventAction extends BaseEventAction<DeleteElementEventActionArgsType> {}

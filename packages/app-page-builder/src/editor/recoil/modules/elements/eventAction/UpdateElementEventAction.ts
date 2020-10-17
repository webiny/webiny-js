import { BaseEventAction } from "@webiny/app-page-builder/editor/recoil/eventActions";
import { PbElement } from "@webiny/app-page-builder/types";

type UpdateElementEventActionArgsType = {
    element: PbElement;
};
export class UpdateElementEventAction extends BaseEventAction<UpdateElementEventActionArgsType> {}

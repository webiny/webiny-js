import { BaseEventAction } from "@webiny/app-page-builder/editor/recoil/eventActions";
import { PbElement } from "@webiny/app-page-builder/types";

type CreateElementEventActionArgsType = {
    element: PbElement;
    source: PbElement;
};
export class CreateElementEventAction extends BaseEventAction<CreateElementEventActionArgsType> {}

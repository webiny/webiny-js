import { DeleteElementActionArgsType } from "@webiny/app-page-builder/editor/recoil/actions/deleteElement/types";
import { BaseEventAction } from "@webiny/app-page-builder/editor/recoil/eventActions";

export class DeleteElementActionEvent extends BaseEventAction<DeleteElementActionArgsType> {
    public getName(): string {
        return "DeleteElementActionEvent";
    }
}

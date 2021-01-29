import { BaseEventAction } from "@webiny/app-page-builder/editor/recoil/eventActions";
import { CloneElementActionArgsType } from "@webiny/app-page-builder/editor/recoil/actions/cloneElement/types";

export class CloneElementActionEvent extends BaseEventAction<CloneElementActionArgsType> {
    public getName(): string {
        return "CloneElementActionEvent";
    }
}

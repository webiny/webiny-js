import { BaseEventAction } from "@webiny/app-page-builder/editor/recoil/eventActions";
import { CreateElementEventActionArgsType } from "./types";

export class CreateElementActionEvent extends BaseEventAction<CreateElementEventActionArgsType> {
    public getName(): string {
        return "CreateElementActionEvent";
    }
}

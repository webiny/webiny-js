import { UpdatePageRevisionActionArgsType } from "./types";
import { BaseEventAction } from "@webiny/app-page-builder/editor/recoil/eventActions";

export class UpdatePageRevisionActionEvent extends BaseEventAction<
    UpdatePageRevisionActionArgsType
> {
    public getName(): string {
        return "UpdatePageRevisionActionEvent";
    }
}

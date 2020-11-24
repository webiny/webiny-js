import { SaveRevisionActionArgsType } from "./types";
import { BaseEventAction } from "@webiny/app-page-builder/editor/recoil/eventActions";

export class SaveRevisionActionEvent extends BaseEventAction<SaveRevisionActionArgsType> {
    public getName(): string {
        return "SaveRevisionActionEvent";
    }
}

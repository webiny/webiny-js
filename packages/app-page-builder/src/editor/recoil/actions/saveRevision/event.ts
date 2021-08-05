import { SaveRevisionActionArgsType, ToggleSaveRevisionStateActionArgsType } from "./types";
import { BaseEventAction } from "../../eventActions";

export class SaveRevisionActionEvent extends BaseEventAction<SaveRevisionActionArgsType> {
    public getName(): string {
        return "SaveRevisionActionEvent";
    }
}

export class ToggleSaveRevisionStateActionEvent extends BaseEventAction<ToggleSaveRevisionStateActionArgsType> {
    public getName(): string {
        return "ToggleSaveRevisionStateActionEvent";
    }
}

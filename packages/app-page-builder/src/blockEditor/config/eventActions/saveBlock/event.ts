import { BaseEventAction } from "~/editor/recoil/eventActions";
import { SaveBlockActionArgsType, ToggleSaveBlockStateActionArgsType } from "./types";

export class SaveBlockActionEvent extends BaseEventAction<SaveBlockActionArgsType> {
    public getName(): string {
        return "SaveBlockActionEvent";
    }
}

export class ToggleSaveBlockStateActionEvent extends BaseEventAction<ToggleSaveBlockStateActionArgsType> {
    public getName(): string {
        return "ToggleSaveBlockStateActionEvent";
    }
}

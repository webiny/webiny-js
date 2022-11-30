import { BaseEventAction } from "~/editor/recoil/eventActions";
import { SaveBlockActionArgsType, ToggleBlockDirtyStateActionArgsType } from "./types";

export class SaveBlockActionEvent extends BaseEventAction<SaveBlockActionArgsType> {
    public getName(): string {
        return "SaveBlockActionEvent";
    }
}

export class ToggleBlockDirtyStateActionEvent extends BaseEventAction<ToggleBlockDirtyStateActionArgsType> {
    public getName(): string {
        return "ToggleBlockDirtyStateActionEvent";
    }
}

import { BaseEventAction } from "~/editor/recoil/eventActions";
import { SaveBlockActionArgsType } from "./types";

export class SaveBlockActionEvent extends BaseEventAction<SaveBlockActionArgsType> {
    public getName(): string {
        return "SaveBlockActionEvent";
    }
}

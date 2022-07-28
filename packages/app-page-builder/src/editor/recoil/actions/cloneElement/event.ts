import { BaseEventAction } from "~/editor/recoil/eventActions";
import { CloneElementActionArgsType } from "./types";

export class CloneElementActionEvent extends BaseEventAction<CloneElementActionArgsType> {
    public getName(): string {
        return "CloneElementActionEvent";
    }
}

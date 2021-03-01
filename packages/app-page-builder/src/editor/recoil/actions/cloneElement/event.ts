import { BaseEventAction } from "../../eventActions";
import { CloneElementActionArgsType } from "./types";

export class CloneElementActionEvent extends BaseEventAction<CloneElementActionArgsType> {
    public getName(): string {
        return "CloneElementActionEvent";
    }
}

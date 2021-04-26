import { MoveBlockActionArgsType } from "./types";
import { BaseEventAction } from "../../eventActions";

export class MoveBlockActionEvent extends BaseEventAction<MoveBlockActionArgsType> {
    public getName(): string {
        return "MoveBlockActionEvent";
    }
}

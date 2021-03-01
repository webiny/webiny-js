import { DropElementActionArgsType } from "./types";
import { BaseEventAction } from "../../eventActions";

export class DropElementActionEvent extends BaseEventAction<DropElementActionArgsType> {
    public getName(): string {
        return "DropElementActionEvent";
    }
}

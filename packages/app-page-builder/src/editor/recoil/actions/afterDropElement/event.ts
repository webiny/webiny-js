import { BaseEventAction } from "../../eventActions";
import { AfterDropElementActionArgsType } from "./types";

export class AfterDropElementActionEvent extends BaseEventAction<AfterDropElementActionArgsType> {
    public getName(): string {
        return "AfterDropElementActionEvent";
    }
}

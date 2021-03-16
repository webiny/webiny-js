import { UpdateElementActionArgsType } from "./types";
import { BaseEventAction } from "../../eventActions";

export class UpdateElementActionEvent extends BaseEventAction<UpdateElementActionArgsType> {
    public getName(): string {
        return "UpdateElementActionEvent";
    }
}

import { DeleteElementActionArgsType } from "./types";
import { BaseEventAction } from "../../eventActions";

export class DeleteElementActionEvent extends BaseEventAction<DeleteElementActionArgsType> {
    public getName(): string {
        return "DeleteElementActionEvent";
    }
}

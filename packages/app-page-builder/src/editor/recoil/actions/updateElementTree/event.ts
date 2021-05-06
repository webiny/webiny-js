import { BaseEventAction } from "../../eventActions";

export class UpdateElementTreeActionEvent extends BaseEventAction {
    public getName(): string {
        return "UpdateElementTreeActionEvent";
    }
}

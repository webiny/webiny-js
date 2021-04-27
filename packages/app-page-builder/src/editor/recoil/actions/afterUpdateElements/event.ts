import { BaseEventAction } from "../../eventActions";

export class AfterUpdateElementsActionEvent extends BaseEventAction {
    public getName(): string {
        return "AfterUpdateElementsActionEvent";
    }
}

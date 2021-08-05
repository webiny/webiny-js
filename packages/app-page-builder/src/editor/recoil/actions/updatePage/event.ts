import { UpdatePageRevisionActionArgsType } from "./types";
import { BaseEventAction } from "../../eventActions";

export class UpdatePageRevisionActionEvent extends BaseEventAction<UpdatePageRevisionActionArgsType> {
    public getName(): string {
        return "UpdatePageRevisionActionEvent";
    }
}

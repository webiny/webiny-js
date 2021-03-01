import { DeactivatePluginActionArgsType } from "./types";
import { BaseEventAction } from "../../eventActions";

export class DeactivatePluginActionEvent extends BaseEventAction<DeactivatePluginActionArgsType> {
    public getName(): string {
        return "DeactivatePluginActionEvent";
    }
}

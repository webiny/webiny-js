import { TogglePluginActionArgsType } from "./types";
import { BaseEventAction } from "../../eventActions";

export class TogglePluginActionEvent extends BaseEventAction<TogglePluginActionArgsType> {
    public getName(): string {
        return "TogglePluginActionEvent";
    }
}

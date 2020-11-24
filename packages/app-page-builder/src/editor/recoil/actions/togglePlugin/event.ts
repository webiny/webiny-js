import { TogglePluginActionArgsType } from "./types";
import { BaseEventAction } from "@webiny/app-page-builder/editor/recoil/eventActions";

export class TogglePluginActionEvent extends BaseEventAction<TogglePluginActionArgsType> {
    public getName(): string {
        return "TogglePluginActionEvent";
    }
}

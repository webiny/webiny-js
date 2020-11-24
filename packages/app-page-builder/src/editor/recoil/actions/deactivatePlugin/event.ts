import { DeactivatePluginActionArgsType } from "./types";
import { BaseEventAction } from "@webiny/app-page-builder/editor/recoil/eventActions";

export class DeactivatePluginActionEvent extends BaseEventAction<DeactivatePluginActionArgsType> {
    public getName(): string {
        return "DeactivatePluginActionEvent";
    }
}

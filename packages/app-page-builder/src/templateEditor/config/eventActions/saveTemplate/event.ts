import { BaseEventAction } from "~/editor/recoil/eventActions";
import { SaveTemplateActionArgsType } from "./types";

export class SaveTemplateActionEvent extends BaseEventAction<SaveTemplateActionArgsType> {
    public getName(): string {
        return "SaveTemplateActionEvent";
    }
}

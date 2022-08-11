import { UpdateDocumentActionArgsType } from "./types";
import { BaseEventAction } from "~/editor/recoil/eventActions";

export class UpdateDocumentActionEvent extends BaseEventAction<UpdateDocumentActionArgsType> {
    public getName(): string {
        return "UpdateDocumentActionEvent";
    }
}

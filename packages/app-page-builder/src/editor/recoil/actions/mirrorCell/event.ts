import { BaseEventAction } from "~/editor/recoil/eventActions";
import { MirrorCellActionArgsType } from "./types";

export class MirrorCellActionEvent extends BaseEventAction<MirrorCellActionArgsType> {
    public getName(): string {
        return "MirrorCellActionEvent";
    }
}

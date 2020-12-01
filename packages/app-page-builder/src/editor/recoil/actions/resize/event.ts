import { ResizeEndActionArgsType, ResizeStartActionArgsType } from "./types";
import { BaseEventAction } from "@webiny/app-page-builder/editor/recoil/eventActions";

export class ResizeStartActionEvent extends BaseEventAction<ResizeStartActionArgsType> {
    public getName(): string {
        return "ResizeStartActionEvent";
    }
}
export class ResizeEndActionEvent extends BaseEventAction<ResizeEndActionArgsType> {
    public getName(): string {
        return "ResizeEndActionEvent";
    }
}

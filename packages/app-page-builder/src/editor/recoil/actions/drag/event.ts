import { DragStartActionArgsType, DragEndActionArgsType } from "./types";
import { BaseEventAction } from "@webiny/app-page-builder/editor/recoil/eventActions";

export class DragStartActionEvent extends BaseEventAction<DragStartActionArgsType> {}
export class DragEndActionEvent extends BaseEventAction<DragEndActionArgsType> {}

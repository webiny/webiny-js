import { ResizeEndActionArgsType, ResizeStartActionArgsType } from "./types";
import { BaseEventAction } from "@webiny/app-page-builder/editor/recoil/eventActions";

export class ResizeStartActionEvent extends BaseEventAction<ResizeStartActionArgsType> {}
export class ResizeEndActionEvent extends BaseEventAction<ResizeEndActionArgsType> {}

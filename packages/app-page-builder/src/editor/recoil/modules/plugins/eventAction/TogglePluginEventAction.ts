import { TogglePluginActionType } from "@webiny/app-page-builder/editor/recoil/actions";
import { BaseEventAction } from "@webiny/app-page-builder/editor/recoil/eventActions";

type TogglePluginEventActionType = TogglePluginActionType;
export class TogglePluginEventAction extends BaseEventAction<TogglePluginEventActionType> {}

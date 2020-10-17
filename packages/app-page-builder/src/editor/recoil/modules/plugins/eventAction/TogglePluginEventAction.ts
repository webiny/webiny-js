import { BaseEventAction } from "@webiny/app-page-builder/editor/recoil/eventActions";

type TogglePluginEventActionType = {
    name: string;
    closeOtherInGroup?: boolean;
};
export class TogglePluginEventAction extends BaseEventAction<TogglePluginEventActionType> {}

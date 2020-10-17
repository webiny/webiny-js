import {
    createElementAction,
    deleteElementAction,
    dropElementAction,
    updateElementAction,
    togglePluginAction
} from "../../recoil/actions";
import { EventActionHandler } from "../../recoil/eventActions";
import {
    CreateElementEventAction,
    DeleteElementEventAction,
    DropElementEventAction,
    UpdateElementEventAction
} from "../../recoil/modules/elements/eventAction";
import { TogglePluginEventAction } from "../../recoil/modules/plugins/eventAction";

export const registerDefaultEventActions = (handler: EventActionHandler): void => {
    handler.on(CreateElementEventAction, createElementAction);
    handler.on(DeleteElementEventAction, deleteElementAction);
    handler.on(DropElementEventAction, dropElementAction);
    handler.on(UpdateElementEventAction, updateElementAction);
    handler.on(TogglePluginEventAction, togglePluginAction);
};

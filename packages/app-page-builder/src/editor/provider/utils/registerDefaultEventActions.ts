import {
    updateElementAction,
    UpdateElementActionEvent
} from "@webiny/app-page-builder/editor/recoil/actions/updateElement";
import {
    createElementAction,
    CreateElementActionEvent,
    deleteElementAction,
    DeleteElementActionEvent,
    dropElementAction,
    DropElementActionEvent,
    togglePluginAction,
    TogglePluginActionEvent
} from "../../recoil/actions";
import { EventActionHandler } from "../../recoil/eventActions";

export const registerDefaultEventActions = (handler: EventActionHandler): void => {
    handler.on(CreateElementActionEvent, createElementAction);
    handler.on(DeleteElementActionEvent, deleteElementAction);
    handler.on(DropElementActionEvent, dropElementAction);
    handler.on(UpdateElementActionEvent, updateElementAction);
    handler.on(TogglePluginActionEvent, togglePluginAction);
};

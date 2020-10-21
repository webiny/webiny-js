import {
    createElementAction,
    CreateElementActionEvent,
    DeactivatePluginActionEvent,
    deactivatePluginAction,
    deleteElementAction,
    DeleteElementActionEvent,
    dropElementAction,
    DropElementActionEvent,
    togglePluginAction,
    TogglePluginActionEvent,
    UpdateElementActionEvent,
    updateElementAction,
    SaveRevisionActionEvent,
    saveRevisionAction
} from "../../recoil/actions";
import { EventActionHandler } from "../../recoil/eventActions";

export const registerDefaultEventActions = (handler: EventActionHandler): void => {
    handler.on(CreateElementActionEvent, createElementAction);
    handler.on(DeactivatePluginActionEvent, deactivatePluginAction);
    handler.on(DeleteElementActionEvent, deleteElementAction);
    handler.on(DropElementActionEvent, dropElementAction);
    handler.on(UpdateElementActionEvent, updateElementAction);
    handler.on(TogglePluginActionEvent, togglePluginAction);
    handler.on(SaveRevisionActionEvent, saveRevisionAction);
};

import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { useEffect } from "react";
import {
    saveRevisionAction,
    SaveRevisionActionEvent,
    toggleSaveRevisionStateAction,
    ToggleSaveRevisionStateActionEvent
} from "./saveRevision";
import { updatePageAction } from "./updatePageAction";
import { UpdateDocumentActionEvent } from "~/editor/recoil/actions";

export const EventActionPlugins = () => {
    const eventActionHandler = useEventActionHandler();

    useEffect(() => {
        const offSaveRevisionAction = eventActionHandler.on(
            SaveRevisionActionEvent,
            saveRevisionAction
        );

        const offToggleSaveRevisionStateAction = eventActionHandler.on(
            ToggleSaveRevisionStateActionEvent,
            toggleSaveRevisionStateAction
        );

        const offUpdatePageAction = eventActionHandler.on(
            UpdateDocumentActionEvent,
            updatePageAction
        );

        return () => {
            offSaveRevisionAction();
            offToggleSaveRevisionStateAction();
            offUpdatePageAction();
        };
    }, []);
    return null;
};

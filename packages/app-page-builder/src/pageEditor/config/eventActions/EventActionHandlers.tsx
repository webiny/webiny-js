import { useEffect } from "react";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import {
    saveRevisionAction,
    SaveRevisionActionEvent,
    toggleSaveRevisionStateAction,
    ToggleSaveRevisionStateActionEvent
} from "./saveRevision";
import { updatePageAction } from "./updatePageAction";
import { UpdateDocumentActionEvent } from "~/editor/recoil/actions";
import { PageEditorEventActionCallableState } from "~/pageEditor/types";

export const EventActionHandlers = () => {
    const eventActionHandler = useEventActionHandler<PageEditorEventActionCallableState>();

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

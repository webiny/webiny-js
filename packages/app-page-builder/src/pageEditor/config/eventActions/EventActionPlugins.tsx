import React, { useEffect } from "react";
import { EditorConfig } from "~/editor";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import {
    saveRevisionAction,
    SaveRevisionActionEvent,
    toggleSaveRevisionStateAction,
    ToggleSaveRevisionStateActionEvent
} from "./saveRevision";
import { updatePageAction } from "./updatePageAction";
import { UpdateDocumentActionEvent } from "~/editor/recoil/actions";

const EventActionHandlers = () => {
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

export const EventActionPlugins = () => {
    return (
        <EditorConfig>
            <EventActionHandlers />
        </EditorConfig>
    );
};

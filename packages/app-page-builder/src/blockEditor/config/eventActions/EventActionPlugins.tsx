import React, { useEffect } from "react";
import { EditorConfig } from "~/editor";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import {
    saveBlockAction,
    SaveBlockActionEvent,
    toggleSaveBlockStateAction,
    ToggleSaveBlockStateActionEvent
} from "./saveBlock";
import { updateBlockAction } from "./updateBlockAction";
import { UpdateDocumentActionEvent } from "~/editor/recoil/actions";
import { BlockEditorEventActionCallableState } from "~/blockEditor/types";

const EventActionHandlers = () => {
    const eventActionHandler = useEventActionHandler<BlockEditorEventActionCallableState>();

    useEffect(() => {
        const offSaveBlockAction = eventActionHandler.on(SaveBlockActionEvent, saveBlockAction);

        const offToggleSaveBlockStateAction = eventActionHandler.on(
            ToggleSaveBlockStateActionEvent,
            toggleSaveBlockStateAction
        );

        const offUpdateBlockAction = eventActionHandler.on(
            UpdateDocumentActionEvent,
            updateBlockAction
        );

        return () => {
            offSaveBlockAction();
            offToggleSaveBlockStateAction();
            offUpdateBlockAction();
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

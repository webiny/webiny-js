import React, { createContext, useContext } from "react";
import { EventActionHandler } from "../recoil/eventActions";
import { useRedo, useUndo } from "recoil-undo";
import { registerDefaultEventActions } from "./utils/registerDefaultEventActions";
import { eventActionTransaction } from "./utils/eventActionTransaction";
import {
    createElementAction,
    deleteElementAction,
    dropElementAction,
    togglePluginAction,
    updateElementAction
} from "../recoil/actions";

type ProviderType = {
    eventActionHandler: EventActionHandler;
    eventActionTransaction: typeof eventActionTransaction;
    actions: {
        createElementAction: typeof createElementAction;
        deleteElementAction: typeof deleteElementAction;
        dropElementAction: typeof dropElementAction;
        togglePluginAction: typeof togglePluginAction;
        updateElementAction: typeof updateElementAction;
    };
    state: {
        useUndo: typeof useUndo;
        useRedo: typeof useRedo;
    };
};
const EditorContext = createContext<ProviderType>(null);
const EditorProvider: React.FunctionComponent<any> = props => {
    const eventActionsHandler = new EventActionHandler();
    const provider: ProviderType = {
        eventActionHandler: eventActionsHandler,
        eventActionTransaction,
        actions: {
            createElementAction,
            deleteElementAction,
            dropElementAction,
            togglePluginAction,
            updateElementAction
        },
        state: {
            useRedo,
            useUndo
        }
    };
    registerDefaultEventActions(eventActionsHandler);

    return <EditorContext.Provider value={provider} {...props} />;
};
const useEditor = () =>
    useContext<Omit<ProviderType, "actions" | "eventActionHandler">>(EditorContext as any);

type UseEventActionHandlerType = () => EventActionHandler;
const useEditorEventActionHandler: UseEventActionHandlerType = () => {
    const { eventActionHandler } = useContext(EditorContext);
    return eventActionHandler;
};
type UseEventActionTransactionType = () => typeof eventActionTransaction;
const useEditorEventActionTransaction: UseEventActionTransactionType = () => {
    const { eventActionTransaction } = useContext(EditorContext);
    return eventActionTransaction;
};

export { EditorProvider, useEditor, useEditorEventActionTransaction, useEditorEventActionHandler };

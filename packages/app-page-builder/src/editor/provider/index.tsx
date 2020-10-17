import React, { createContext, useContext } from "react";
import { EventActionHandler } from "../recoil/eventActions";
import { useRedo, useUndo } from "recoil-undo";
import { registerDefaultEventActions } from "./utils/registerDefaultEventActions";
import { eventActionTransaction } from "./utils/eventActionTransaction";
import {
    dropElementAction,
    DropElementActionCallableType,
    updateElementAction,
    UpdateElementActionCallableType
} from "../recoil/actions";

type ActionTransactionCallableType = (Function) => Promise<any>;
type ProviderType = {
    eventActionHandler: EventActionHandler;
    actions: {
        dropElementAction: DropElementActionCallableType;
        updateElementAction: UpdateElementActionCallableType;
        eventActionTransaction: ActionTransactionCallableType;
    };
    flow: {
        undo: () => void;
        redo: () => void;
    };
};
const EditorContext = createContext<ProviderType>(null);
const EditorProvider: React.FunctionComponent<any> = props => {
    const eventActionsHandler = new EventActionHandler();
    const provider: ProviderType = {
        eventActionHandler: eventActionsHandler,
        actions: {
            dropElementAction,
            updateElementAction,
            eventActionTransaction
        },
        flow: {
            redo: useRedo(),
            undo: useUndo()
        }
    };
    eventActionsHandler.clearEventRegistry();
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
type UseEventActionTransactionType = () => ActionTransactionCallableType;
const useEditorEventActionTransaction: UseEventActionTransactionType = () => {
    const {
        actions: { eventActionTransaction }
    } = useContext(EditorContext);
    return eventActionTransaction;
};

export { EditorProvider, useEditor, useEditorEventActionTransaction, useEditorEventActionHandler };

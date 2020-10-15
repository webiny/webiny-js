import React from "react";
import { EventActionHandler } from "../eventActions";
import {
    dropElementAction,
    DropElementActionCallableType,
    updateElementAction,
    UpdateElementActionCallableType
} from "../actions";

type ProviderType = {
    eventActions: EventActionHandler;
    actions: {
        dropElementAction: DropElementActionCallableType;
        updateElementAction: UpdateElementActionCallableType;
    };
};
const EditorContext = React.createContext<ProviderType>(null);
const EditorProvider: React.FunctionComponent<any> = props => {
    const eventActionsHandler = new EventActionHandler();
    const provider = {
        eventActions: eventActionsHandler,
        actions: {
            dropElementAction,
            updateElementAction
        }
    };
    eventActionsHandler.clearEventRegistry();

    return <EditorContext.Provider value={provider} {...props} />;
};
const useEditor = () => React.useContext<ProviderType>(EditorContext);

export { EditorProvider, useEditor };

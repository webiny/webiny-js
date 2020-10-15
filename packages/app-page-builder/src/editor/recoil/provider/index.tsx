import React from "react";
import { EventActionHandler } from "../eventActions";

type ProviderType = {
    actions: EventActionHandler;
};
const EditorContext = React.createContext<ProviderType>(null);
const EditorProvider: React.FunctionComponent<any> = props => {
    const eventActionsHandler = new EventActionHandler();
    const provider = {
        actions: eventActionsHandler
    };
    eventActionsHandler.clearEventRegistry();

    return <EditorContext.Provider value={provider} {...props} />;
};
const useEditor = () => React.useContext<ProviderType>(EditorContext);

export { EditorProvider, useEditor };

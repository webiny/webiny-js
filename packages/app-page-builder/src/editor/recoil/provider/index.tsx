import React from "react";
import { ActionsEnum, runAction, subscribe, unsubscribe, unsubscribeAll } from "./actions";

type ProviderType = {
    actions: {
        unsubscribeAll: () => void;
        run: (action: string, args?: { [key: string]: any }) => Promise<ActionsEnum>;
        subscribe: (action: string, callable: Function) => void;
        unsubscribe: (action: string, callable: Function) => void;
    };
};
const EditorContext = React.createContext<ProviderType>(null);
const EditorProvider: React.FunctionComponent<any> = props => {
    const provider = {
        actions: {
            unsubscribeAll,
            run: runAction,
            subscribe,
            unsubscribe
        }
    };
    unsubscribeAll();

    return <EditorContext.Provider value={provider} {...props} />;
};
const useEditor = () => React.useContext<ProviderType>(EditorContext);

export { EditorProvider, useEditor };

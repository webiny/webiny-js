import { EventActionHandler } from "@webiny/app-page-builder/editor/recoil/eventActions";
import {
    contentAtom,
    elementsAtom,
    pageAtom,
    pluginsAtom,
    revisionsAtom,
    uiAtom
} from "@webiny/app-page-builder/editor/recoil/modules";
import { connectedAtomValue } from "@webiny/app-page-builder/editor/recoil/modules/connected";
import { PbState } from "@webiny/app-page-builder/editor/recoil/modules/types";
import React, { createContext, useContext } from "react";
import { useApolloClient } from "react-apollo";

type ProviderType = {
    eventActionHandler: EventActionHandler;
};
const EditorContext = createContext<ProviderType>(null);
export const EditorProvider: React.FunctionComponent<any> = props => {
    const apolloClient = useApolloClient();
    const handlerRef = React.useRef<EventActionHandler>(null);
    if (!handlerRef.current) {
        handlerRef.current = new EventActionHandler(["content"], {
            client: apolloClient
        });
    }
    const provider: ProviderType = {
        eventActionHandler: handlerRef.current
    };
    return (
        <EditorContext.Provider value={provider} {...props}>
            {props.children}
        </EditorContext.Provider>
    );
};

export const getGlobalState = (): PbState => ({
    ui: connectedAtomValue(uiAtom),
    plugins: connectedAtomValue(pluginsAtom),
    elements: connectedAtomValue(elementsAtom),
    page: connectedAtomValue(pageAtom),
    content: connectedAtomValue(contentAtom),
    revisions: connectedAtomValue(revisionsAtom)
});

(window as any).getGlobalState = getGlobalState;

export const useEventActionHandler = (): EventActionHandler => {
    const ctx = useContext<ProviderType>(EditorContext as any);
    return ctx.eventActionHandler;
};

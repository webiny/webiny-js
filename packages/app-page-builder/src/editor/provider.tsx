import { EventActionHandler } from "@webiny/app-page-builder/editor/recoil/eventActions";
import {
    contentAtom,
    elementsAtom,
    pageAtom,
    pluginsAtom,
    uiAtom
} from "@webiny/app-page-builder/editor/recoil/modules";
import { connectedAtomValue } from "@webiny/app-page-builder/editor/recoil/modules/connected";
import React, { createContext, useContext } from "react";

type ProviderType = {
    eventActionHandler: EventActionHandler;
};
const EditorContext = createContext<ProviderType>(null);
export const EditorProvider: React.FunctionComponent<any> = props => {
    const handlerRef = React.useRef<EventActionHandler>(new EventActionHandler(["content"]));
    const provider: ProviderType = {
        eventActionHandler: handlerRef.current
    };
    return (
        <EditorContext.Provider value={provider} {...props}>
            {props.children}
        </EditorContext.Provider>
    );
};

export const getGlobalState = () => ({
    ui: connectedAtomValue(uiAtom),
    plugins: connectedAtomValue(pluginsAtom),
    elements: connectedAtomValue(elementsAtom),
    page: connectedAtomValue(pageAtom),
    content: connectedAtomValue(contentAtom)
});

(window as any).getGlobalState = getGlobalState;

export const useEventActionHandler = (): EventActionHandler => {
    const ctx = useContext<ProviderType>(EditorContext as any);
    return ctx.eventActionHandler;
};

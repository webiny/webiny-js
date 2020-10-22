import { EventActionHandler } from "@webiny/app-page-builder/editor/recoil/eventActions";
import {
    elementsAtom,
    ElementsAtomType,
    pageAtom,
    PageAtomType,
    pluginsAtom,
    PluginsAtomType,
    uiAtom,
    UiAtomType
} from "@webiny/app-page-builder/editor/recoil/modules";
import {
    connectedAtomValue,
    updateConnectedValue
} from "@webiny/app-page-builder/editor/recoil/modules/connected";
import React, { createContext, useContext } from "react";
import { RecoilState, useRecoilState } from "recoil";

type ProviderType = {
    eventActionHandler: EventActionHandler;
};
const EditorContext = createContext<ProviderType>(null);
export const EditorProvider: React.FunctionComponent<any> = props => {
    const eventActionHandler = new EventActionHandler();
    const provider: ProviderType = {
        eventActionHandler
    };
    console.log("CONSTRUCTED EVENT ACTION HANDLER");
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
    page: connectedAtomValue(pageAtom)
});

(window as any).getGlobalState = getGlobalState;

export const useEventActionHandler = (): EventActionHandler => {
    const ctx = useContext<ProviderType>(EditorContext as any);
    return ctx.eventActionHandler;
};

import { registerDefaultEventActions } from "@webiny/app-page-builder/editor/provider/utils/registerDefaultEventActions";
import { EventActionHandler } from "@webiny/app-page-builder/editor/recoil/eventActions";
import {
    elementsAtom,
    pageAtom,
    pluginsAtom,
    uiAtom
} from "@webiny/app-page-builder/editor/recoil/modules";
import {
    connectedAtomValue,
    updateConnectedValue
} from "@webiny/app-page-builder/editor/recoil/modules/connected";
import React, { createContext, useContext } from "react";
import { RecoilState } from "recoil";

type ProviderType = {
    eventActionHandler: EventActionHandler;
};
const EditorContext = createContext<ProviderType>(null);
export const EditorProvider: React.FunctionComponent<any> = props => {
    const eventActionHandler = new EventActionHandler();
    const provider: ProviderType = {
        eventActionHandler
    };
    registerDefaultEventActions(eventActionHandler);
    return (
        <EditorContext.Provider value={provider} {...props}>
            {props.children}
        </EditorContext.Provider>
    );
};
export const useEditor = () => useContext<ProviderType>(EditorContext as any);

const createUseEditorStateAtom = <T extends any>(atom: RecoilState<T>) => {
    return {
        set: (value: T): void => {
            updateConnectedValue(atom, value);
        },
        get: (): T => {
            return connectedAtomValue(atom);
        }
    };
};
export const useEditorState = () => {
    return {
        ui: createUseEditorStateAtom(uiAtom),
        plugins: createUseEditorStateAtom(pluginsAtom),
        elements: createUseEditorStateAtom(elementsAtom),
        page: createUseEditorStateAtom(pageAtom)
    };
};

export const useEventActionHandler = (): EventActionHandler => {
    const ctx = useContext<ProviderType>(EditorContext as any);
    return ctx.eventActionHandler;
};

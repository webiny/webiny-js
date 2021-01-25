import React, { createContext, useContext } from "react";
import { useApolloClient } from "react-apollo";
import { plugins } from "@webiny/plugins";
import merge from "lodash/merge";
import { PbConfigPluginType, PbConfigType } from "../types";
import { EventActionHandler } from "@webiny/app-page-builder/editor/recoil/eventActions";
import {
    activeElementAtom,
    contentAtom,
    elementsAtom,
    highlightElementAtom,
    pageAtom,
    pluginsAtom,
    revisionsAtom,
    sidebarAtom,
    uiAtom
} from "@webiny/app-page-builder/editor/recoil/modules";
import { connectedAtomValue } from "@webiny/app-page-builder/editor/recoil/modules/connected";
import { PbState } from "@webiny/app-page-builder/editor/recoil/modules/types";

const createConfiguration = (plugins: PbConfigPluginType[]): PbConfigType => {
    return plugins.reduce(
        (acc, pl) => {
            return merge(acc, pl.config());
        },
        { maxEventActionsNesting: 5 }
    );
};

type ProviderType = {
    eventActionHandler: EventActionHandler;
};
const EditorContext = createContext<ProviderType>(null);
export const EditorProvider: React.FunctionComponent<any> = props => {
    const apolloClient = useApolloClient();
    const handlerRef = React.useRef<EventActionHandler>(null);
    if (!handlerRef.current) {
        const config = createConfiguration(plugins.byType("pb-config"));
        handlerRef.current = new EventActionHandler(
            ["content"],
            {
                client: apolloClient
            },
            config
        );
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
    activeElement: connectedAtomValue(activeElementAtom),
    highlightElement: connectedAtomValue(highlightElementAtom),
    ui: connectedAtomValue(uiAtom),
    plugins: connectedAtomValue(pluginsAtom),
    elements: connectedAtomValue(elementsAtom),
    page: connectedAtomValue(pageAtom),
    content: connectedAtomValue(contentAtom),
    revisions: connectedAtomValue(revisionsAtom),
    sidebar: connectedAtomValue(sidebarAtom)
});

(window as any).getGlobalState = getGlobalState;

export const useEventActionHandler = (): EventActionHandler => {
    const ctx = useContext<ProviderType>(EditorContext as any);
    return ctx.eventActionHandler;
};

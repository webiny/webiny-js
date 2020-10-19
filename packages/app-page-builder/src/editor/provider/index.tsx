import editorStatePlugin, { EditorStatePluginType } from "@webiny/app-page-builder/editor/provider/editorStatePlugin";
import { TogglePluginActionProvider } from "@webiny/app-page-builder/editor/provider/TogglePluginActionProvider";
import { UpdateElementActionProvider } from "@webiny/app-page-builder/editor/provider/UpdateElementActionProvider";
import {
    activePluginsByTypeNamesSelector,
    elementsAtom,
    pageAtom, pluginsAtom,
    uiAtom
} from "@webiny/app-page-builder/editor/recoil/modules";
import { getActivePlugins } from "@webiny/app-page-builder/editor/selectors";
import { plugins } from "@webiny/plugins";
import React, { createContext, useContext } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { getStateRegistry } from "./EditorStateRegistry";
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
plugins.register(editorStatePlugin);
const EditorContext = createContext<ProviderType>(null);

const StateActionComponent = ({action}) => {
    const runs = React.useRef(0);

    const [uiAtomValue, setUiAtomValue] = useRecoilState(uiAtom);
    const [pageAtomValue, setPageAtomValue] = useRecoilState(pageAtom);
    const [elementsAtomValue, setElementsAtomValue] = useRecoilState(elementsAtom);
    const [pluginsAtomValue, setPluginsAtomValue] = useRecoilState(pluginsAtom);

    console.log("STATE COMPONENT");
    React.useEffect(() => {
        if (runs.current === 0) {
            return;
        }
        console.log("STATE COMPONENT INSIDE");
        action({
            ui: uiAtomValue,
            setUi: setUiAtomValue,
            page: pageAtomValue,
            setPage: setPageAtomValue,
            elements: elementsAtomValue,
            setElements: setElementsAtomValue,
            plugins: pluginsAtomValue,
            setPlugins: setPluginsAtomValue,
            isFirstRun: runs.current === 1,
        });
        runs.current++;
    }, []);
    return null;
};
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

    const activePluginNamesByType = useRecoilValue(activePluginsByTypeNamesSelector("pb-editor-state-action"))

    // const activePluginsByType = activePluginNamesByType.map(name => plugins.byName(name));
    const activePluginsByType = plugins.byType("pb-editor-state-action");

    return (
        <EditorContext.Provider value={provider} {...props}>
            {activePluginsByType.map(({name, stateAction}) => {
                return (
                    <StateActionComponent
                        key={`csp-${name}`}
                        action={stateAction}
                    />
                );
            })}
            <UpdateElementActionProvider>
                <TogglePluginActionProvider>
                    {props.children}
                </TogglePluginActionProvider>
            </UpdateElementActionProvider>
        </EditorContext.Provider>
    );
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

export { EditorProvider, useEditor, useEditorEventActionTransaction, useEditorEventActionHandler, getStateRegistry };

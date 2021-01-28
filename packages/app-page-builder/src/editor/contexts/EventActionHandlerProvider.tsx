import {useApolloClient} from "react-apollo";
import React, {createContext, useEffect, useMemo, useRef} from "react";
import merge from "lodash/merge";
import {plugins} from "@webiny/plugins";
import {
    rootElementAtom,
    elementsAtom,
    pageAtom,
    pluginsAtom,
    revisionsAtom,
    sidebarAtom,
    uiAtom,
    elementByIdSelector,
    activeElementAtom,
    highlightElementAtom, elementsIdListAtom, PluginsAtomType, SidebarAtomType
} from "../recoil/modules";

import {PbState} from "../recoil/modules/types";
import {EventAction} from "../recoil/eventActions/EventAction";
import {
    EventActionHandlerCallableArgs,
    EventActionCallable,
    EventActionHandlerActionCallableResponse,
    EventActionHandlerConfig,
    PbConfigPluginType,
    PbConfigType,
    PbEditorElement,
    EventActionHandler,
    EventActionHandlerTarget,
    EventActionHandlerCallableState
} from "@webiny/app-page-builder/types";
import {
    Snapshot,
    useRecoilCallback,
    useRecoilSnapshot,
    useRecoilState,
    useRecoilValue,
    useSetRecoilState
} from "recoil";

type ListType = Map<symbol, EventActionCallable>;
type RegistryType = Map<string, ListType>;

interface StateHistorySnapshot {
    plugins: PluginsAtomType;
    activeElement: null;
    highlightElement: null;
    sidebar: SidebarAtomType;
    elements: Record<string, PbEditorElement>;
}

interface StateHistoryInfo {
    busy: boolean;
    key: number | null;
}

export const EventActionHandlerContext = createContext<EventActionHandler>(null);

const createConfiguration = (plugins: PbConfigPluginType[]): PbConfigType => {
    return plugins.reduce(
        (acc, pl) => {
            return merge(acc, pl.config());
        },
        {maxEventActionsNesting: 5}
    );
};

const getEventActionClassName = (target: EventActionHandlerTarget): string => {
    const cls = new target();
    const name = cls.getName();
    if(!name) {
        throw new Error("Could not find class name.");
    }
    return name;
};

const trackedAtoms = [
    "elements",
];
const isTrackedAtomChanged = (state: Partial<PbState>): boolean => {
    for(const atom of trackedAtoms) {
        if(!state[atom]) {
            continue;
        }
        return true;
    }
    return false;
};


export const EventActionHandlerProvider: React.FunctionComponent<any> = ({children}) => {
    const apolloClient = useApolloClient();
    const setActiveElementAtomValue = useSetRecoilState(activeElementAtom);
    const setHighlightElementAtomValue = useSetRecoilState(highlightElementAtom);
    const [sidebarAtomValue, setSidebarAtomValue] = useRecoilState(sidebarAtom);
    const rootElementAtomValue = useRecoilValue(rootElementAtom);
    const [pageAtomValue, setPageAtomValue] = useRecoilState(pageAtom);
    const [pluginsAtomValue, setPluginsAtomValue] = useRecoilState(pluginsAtom);
    const [uiAtomValue, setUiAtomValue] = useRecoilState(uiAtom);
    const [elementsIdListAtomValue, setElementsIdListAtomValue] = useRecoilState(elementsIdListAtom);
    const revisionsAtomValue = useRecoilValue(revisionsAtom);
    const snapshot = useRecoilSnapshot();
    
    const sidebarAtomValueRef = useRef(null);
    const rootElementAtomValueRef = useRef(null);
    const pageAtomValueRef = useRef(null);
    const pluginsAtomValueRef = useRef(null);
    const uiAtomValueRef = useRef(null);
    const revisionsAtomValueRef = useRef(null);
    const snapshotRef = useRef(null);
    const eventElements = useRef({});
    const elementsIdListRef = useRef<string[]>([]);
    // elements history used to track elementsAtom changes
    const stateHistory = useRef<StateHistorySnapshot[]>([]);
    const stateHistoryInfo = useRef<StateHistoryInfo>({
        busy: false,
        key: null,
    });
    const isBatching = useRef<boolean>(false);
    
    useEffect(() => {
        sidebarAtomValueRef.current = sidebarAtomValue;
        rootElementAtomValueRef.current = rootElementAtomValue;
        pageAtomValueRef.current = pageAtomValue;
        pluginsAtomValueRef.current = pluginsAtomValue;
        uiAtomValueRef.current = uiAtomValue;
        revisionsAtomValueRef.current = revisionsAtomValue;
        snapshotRef.current = snapshot;
        (window as any).stateHistory = stateHistory.current;
        (window as any).stateHistoryInfo = stateHistoryInfo.current;
            (window as any).elementsList = elementsIdListRef.current = elementsIdListAtomValue;
    }, [
        sidebarAtomValue,
        rootElementAtomValue,
        pageAtomValue,
        pluginsAtomValue,
        uiAtomValue,
        revisionsAtomValue
    ]);
    
    const registry = useRef<RegistryType>(new Map());
    
    const config = useRef<EventActionHandlerConfig>(
        createConfiguration(plugins.byType("pb-config"))
    );
    
    const updateElements = useRecoilCallback(({set}) => (elements: PbEditorElement[] = []) => {
        const updated = elements.map(item => {
            set(elementsAtom(item.id), prevValue => {
                return {
                    ...prevValue,
                    ...item,
                    parent: item.parent !== undefined ? item.parent : prevValue.parent
                };
            });
            return item.id;
        });
        setElementsIdListAtomValue(prev => {
            // do not allow doubles
            return prev
                .filter(id => {
                    return !updated.includes(id);
                })
                .concat(updated);
        });
    });
    
    const getElementTree = async element => {
        if(!element) {
            element = await getElementById(rootElementAtomValue);
        }
        return {
            id: element.id,
            type: element.type,
            data: element.data,
            elements: await Promise.all(
                element.elements.map(async child => {
                    return getElementTree(await getElementById(child));
                })
            )
        };
    };
    
    const get = (name: string): ListType => {
        const list = registry.current.get(name);
        if(!list) {
            throw new Error(`There is no event action group "${name}" defined.`);
        }
        return list;
    };
    
    const set = (name: string, list: ListType): void => {
        registry.current.set(name, list);
    };
    
    const has = (name: string): boolean => {
        return registry.current.has(name);
    };
    
    const hasCb = (list: ListType, callable: EventActionCallable): boolean => {
        const values = Array.from(list.values());
        return values.some(cb => cb === callable);
    };
    
    const off = (id: symbol): boolean => {
        const registryItems = Array.from(registry.current.values());
        for(const list of registryItems) {
            if(!list.has(id)) {
                continue;
            }
            return list.delete(id);
        }
        return false;
    };
    
    const getElementById = async (id: string) => {
        if(eventElements.current.hasOwnProperty(id)) {
            return eventElements.current[id];
        }
        return snapshotRef.current.getPromise(elementByIdSelector(id));
    };
    
    const getCallableState = (
        state: Partial<EventActionHandlerCallableState>
    ): EventActionHandlerCallableState => {
        return {
            sidebar: sidebarAtomValueRef.current,
            rootElement: rootElementAtomValueRef.current,
            page: pageAtomValueRef.current,
            plugins: pluginsAtomValueRef.current,
            ui: uiAtomValueRef.current,
            revisions: revisionsAtomValueRef.current,
            getElementById,
            getElementTree,
            ...state
        };
    };
    
    const createElementsStateHistorySnapshot = async (): Promise<Record<string, PbEditorElement>> => {
        // TODO this is getting wrong values
        const promises = elementsIdListRef.current.map((id: string): Promise<PbEditorElement> => {
            return getElementById(id);
        });
        
        const elements = await Promise.all(promises);
        console.log(elements);
        return elements.reduce((acc, element) => {
            acc[element.id] = element;
            return acc;
        }, {});
    };
    
    const createStateHistorySnapshot = async (): Promise<void> => {
        if(stateHistoryInfo.current.busy === true) {
            return;
        }
        stateHistoryInfo.current.busy = true;
        const key = stateHistoryInfo.current.key;
        const elements = await createElementsStateHistorySnapshot();
        // when saving new state history we must remove everything after the current one
        // since this is the new starting point of the state history
        if(key !== null) {
            stateHistory.current.splice(key + 1);
        }
        stateHistory.current.push({
            plugins: pluginsAtomValueRef.current,
            activeElement: null,
            highlightElement: null,
            sidebar: sidebarAtomValueRef.current,
            elements,
        });
        stateHistoryInfo.current = {
            key: stateHistory.current.length - 1,
            busy: false,
        };
        console.log(stateHistoryInfo.current);
        console.log(stateHistory.current[stateHistoryInfo.current.key]);
    };
    
    const saveCallablesResults = (state: Partial<PbState>, history: boolean = true): void => {
        if(Object.values(state).length === 0) {
            return;
        }
        else if(history && isBatching.current === false && isTrackedAtomChanged(state)) {
            // fn is async but we do not need to wait for it to end, just let it save the history
            createStateHistorySnapshot();
        }
        
        if(state.ui) {
            setUiAtomValue(state.ui);
        }
        
        if(state.plugins) {
            setPluginsAtomValue(state.plugins);
        }
        
        if(state.page) {
            setPageAtomValue(state.page);
        }
        
        if(state.hasOwnProperty("activeElement")) {
            setActiveElementAtomValue(state.activeElement);
        }
        
        if(state.hasOwnProperty("highlightElement")) {
            setHighlightElementAtomValue(state.highlightElement);
        }
        
        if(state.elements) {
            updateElements(Object.values(state.elements));
        }
        
        if(state.sidebar) {
            setSidebarAtomValue(state.sidebar);
        }
        
    };
    
    const eventActionHandler = useMemo<EventActionHandler>(
        () => ({
            on: (target, callable) => {
                const name = getEventActionClassName(target);
                if(!has(name)) {
                    set(name, new Map());
                }
                const events = get(name);
                if(hasCb(events, callable)) {
                    throw new Error(
                        `You cannot register event action "${name}" with identical function that already is registered.`
                    );
                }
                
                const id = Symbol(`eventActionCb:${name}`);
                events.set(id, callable);
                return () => {
                    return off(id);
                };
            },
            trigger: async ev => {
                const results = await triggerEventAction(ev, {} as any, []);
                console.log(`saving results`, results.state);
                saveCallablesResults(results.state);
                return results.state;
            },
            undo: () => {
                const current = stateHistoryInfo.current;
                if(current.busy === true || current.key === null || current.key <= 0) {
                    return;
                }
                setStateHistory(current.key - 1);
            },
            redo: () => {
                const current = stateHistoryInfo.current;
                if(current.busy === true || current.key === null) {
                    return;
                }
                setStateHistory(current.key + 1);
            },
            startBatch: () => {
                isBatching.current = true;
            },
            endBatch: () => {
                isBatching.current = false;
            },
        }),
        []
    );
    
    const setStateHistory = async (target: number): Promise<void> => {
        console.log("setting state target", target);
        if(!stateHistory.current[target]) {
            return;
        }
        console.log("proceed", target);
        stateHistoryInfo.current.busy = true;
        const state = stateHistory.current[target];
        console.log(state);
        await saveCallablesResults(state, false);
        stateHistoryInfo.current = {
            key: target,
            busy: false,
        }
    };
    
    const triggerEventAction = async <T extends EventActionHandlerCallableArgs>(
        ev: EventAction<T>,
        initialState: PbState,
        initiator: string[]
    ): Promise<EventActionHandlerActionCallableResponse> => {
        if(initiator.length >= config.current.maxEventActionsNesting) {
            throw new Error(
                `Max (${
                    config.current.maxEventActionsNesting
                }) allowed levels of nesting actions reached: ${initiator.join(" -> ")}`
            );
        }
        
        if(initiator.length === 0) {
            // Reset elements taking part in the event processing at the beginning of the cycle
            eventElements.current = {};
        }
        
        const name = ev.getName();
        if(!has(name)) {
            throw new Error(`There is no event action that is registered with name "${name}".`);
        }
        const targetCallables = get(name);
        const results: EventActionHandlerActionCallableResponse = {
            state: {},
            actions: []
        };
        if(!targetCallables) {
            return results;
        }
        const args = ev.getArgs();
        const callables = Array.from(targetCallables.values());
        for(const cb of callables) {
            const r =
                (await cb(
                    getCallableState({...initialState, ...results.state}),
                    {client: apolloClient, eventActionHandler},
                    args
                )) || {};
            results.state = {
                ...results.state,
                ...(r.state || {})
            };
            
            results.actions.push(...(r.actions || []));
        }
        
        eventElements.current = {...eventElements.current, ...results.state.elements};
        
        for(const action of results.actions) {
            const r = await triggerEventAction(
                action,
                getCallableState({...initialState, ...results.state}),
                initiator.concat([name])
            );
            results.state = {
                ...(results.state || {}),
                ...(r.state || {})
            };
        }
        return results;
    };
    
    return (
        <EventActionHandlerContext.Provider value={eventActionHandler}>
            {children}
        </EventActionHandlerContext.Provider>
    );
};

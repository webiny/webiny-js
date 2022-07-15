import React, { createContext, useCallback, useEffect, useMemo, useRef } from "react";
import {
    Snapshot,
    useGotoRecoilSnapshot,
    useRecoilCallback,
    useRecoilSnapshot,
    useRecoilState,
    useRecoilValue,
    useSetRecoilState
} from "recoil";
import merge from "lodash/merge";
import { useApolloClient } from "@apollo/react-hooks";
import { makeComposable } from "@webiny/app-admin";
import { plugins } from "@webiny/plugins";
import {
    rootElementAtom,
    elementsAtom,
    pluginsAtom,
    sidebarAtom,
    uiAtom,
    elementByIdSelector,
    activeElementAtom,
    highlightElementAtom,
    SidebarAtomType,
    RootElementAtom,
    PluginsAtomType,
    UiAtomType
} from "../recoil/modules";

import { PbState } from "../recoil/modules/types";
import { EventAction } from "~/editor/recoil/eventActions";
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
} from "~/types";
import { composeSync, SyncProcessor } from "@webiny/utils/compose";
import { UpdateElementTreeActionEvent } from "~/editor/recoil/actions";

type ListType = Map<symbol, EventActionCallable>;
type RegistryType = Map<string, ListType>;

interface SnapshotHistory {
    past: Snapshot[];
    future: Snapshot[];
    busy: boolean;
    present: Snapshot | null;
    isBatching: boolean;
    isDisabled: boolean;
}

export const EventActionHandlerContext = createContext<EventActionHandler | undefined>(undefined);

const createConfiguration = (plugins: PbConfigPluginType[]): PbConfigType => {
    return plugins.reduce(
        (acc, pl) => {
            return merge(acc, pl.config());
        },
        { maxEventActionsNesting: 5 }
    );
};

const getEventActionClassName = (target: EventActionHandlerTarget): string => {
    const cls = new target();
    const name = cls.getName();
    if (!name) {
        throw new Error("Could not find class name.");
    }
    return name;
};

const trackedAtoms: (keyof PbState)[] = ["elements"];
const isTrackedAtomChanged = (state: Partial<PbState>): boolean => {
    for (const atom of trackedAtoms) {
        if (!state[atom]) {
            continue;
        }
        return true;
    }
    return false;
};

export type GetCallableState = SyncProcessor<Partial<EventActionHandlerCallableState>>;
export type SaveCallableResults<TState = Partial<PbState>> = SyncProcessor<{
    state: TState & Partial<PbState>;
    history?: boolean;
}>;

export interface EventActionHandlerProviderProps<TState> {
    getCallableState?: Array<GetCallableState>;
    saveCallablesResults?: Array<SaveCallableResults<TState>>;
}

export const EventActionHandlerProvider = makeComposable<
    EventActionHandlerProviderProps<Partial<PbState>>
>("EventActionHandlerProvider", ({ children, ...props }) => {
    const apolloClient = useApolloClient();
    const setActiveElementAtomValue = useSetRecoilState(activeElementAtom);
    const setHighlightElementAtomValue = useSetRecoilState(highlightElementAtom);
    const [sidebarAtomValue, setSidebarAtomValue] = useRecoilState(sidebarAtom);
    const rootElementAtomValue = useRecoilValue(rootElementAtom);
    const [pluginsAtomValue, setPluginsAtomValue] = useRecoilState(pluginsAtom);
    const [uiAtomValue, setUiAtomValue] = useRecoilState(uiAtom);
    const snapshot = useRecoilSnapshot();

    const eventActionHandlerRef = useRef<EventActionHandler>();
    const sidebarAtomValueRef = useRef<SidebarAtomType>();
    const rootElementAtomValueRef = useRef<RootElementAtom>();
    const pluginsAtomValueRef = useRef<PluginsAtomType>();
    const uiAtomValueRef = useRef<UiAtomType>();
    const snapshotRef = useRef<Snapshot>();
    const eventElements = useRef<Record<string, PbEditorElement>>({});
    const snapshotsHistory = useRef<SnapshotHistory>({
        past: [],
        future: [],
        present: null,
        busy: false,
        isBatching: false,
        isDisabled: false
    });
    const goToSnapshot = useGotoRecoilSnapshot();

    useEffect(() => {
        sidebarAtomValueRef.current = sidebarAtomValue;
        rootElementAtomValueRef.current = rootElementAtomValue;
        pluginsAtomValueRef.current = pluginsAtomValue;
        uiAtomValueRef.current = uiAtomValue;
        snapshotRef.current = snapshot;
    }, [sidebarAtomValue, rootElementAtomValue, pluginsAtomValue, uiAtomValue]);

    const registry = useRef<RegistryType>(new Map());

    const config = useRef<EventActionHandlerConfig>(
        createConfiguration(plugins.byType("pb-config"))
    );

    const updateElementTree = () => {
        setTimeout(() => {
            eventActionHandlerRef.current!.trigger(new UpdateElementTreeActionEvent());
        }, 200);
    };

    const updateElements = useRecoilCallback(({ set }) => (elements: PbEditorElement[] = []) => {
        elements.forEach(item => {
            set(elementsAtom(item.id), prevValue => {
                if (!prevValue) {
                    return {
                        ...item
                    };
                }
                return {
                    ...prevValue,
                    ...item,
                    parent: item.parent !== undefined ? item.parent : prevValue.parent
                };
            });
            return item.id;
        });
        updateElementTree();
    });

    const takeSnapshot = useRecoilCallback(({ snapshot }) => () => {
        return snapshot;
    });

    const getElementTree = async (
        element?: PbEditorElement,
        path: string[] = []
    ): Promise<PbEditorElement> => {
        if (!element) {
            element = (await getElementById(rootElementAtomValue)) as PbEditorElement;
        }
        if (element.parent) {
            path.push(element.parent);
        }
        return {
            id: element.id,
            type: element.type,
            data: element.data,
            elements: await Promise.all(
                /**
                 * We are positive that element.elements is array of strings.
                 */
                (element.elements as string[]).map(async child => {
                    return getElementTree((await getElementById(child)) as PbEditorElement, [
                        ...path
                    ]);
                })
            ),
            path
        };
    };

    const get = (name: string): ListType => {
        const list = registry.current.get(name);
        if (!list) {
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
        for (const list of registryItems) {
            if (!list.has(id)) {
                continue;
            }
            return list.delete(id);
        }
        return false;
    };

    const getElementById = async (id: string): Promise<PbEditorElement> => {
        if (eventElements.current.hasOwnProperty(id)) {
            return eventElements.current[id];
        }
        return (snapshotRef.current as Snapshot).getPromise(
            elementByIdSelector(id)
        ) as Promise<PbEditorElement>;
    };

    const defaultGetCallableState = useCallback<GetCallableState>(
        () => state => {
            return {
                sidebar: sidebarAtomValueRef.current as SidebarAtomType,
                rootElement: rootElementAtomValueRef.current as RootElementAtom,
                plugins: pluginsAtomValueRef.current as PluginsAtomType,
                ui: uiAtomValueRef.current as UiAtomType,
                getElementById,
                getElementTree,
                ...state
            };
        },
        []
    );

    const getCallableState = useMemo(() => {
        return composeSync([...(props.getCallableState || []), defaultGetCallableState]);
    }, []);

    const createStateHistorySnapshot = (): void => {
        if (snapshotsHistory.current.busy === true) {
            return;
        }
        snapshotsHistory.current.busy = true;
        // when saving new state history we must remove everything after the current one
        // since this is the new starting point of the state history
        snapshotsHistory.current.future = [];
        snapshotsHistory.current.past.push(takeSnapshot());
        snapshotsHistory.current.present = null;
        snapshotsHistory.current.busy = false;
    };

    const defaultSaveCallablesResults = useCallback<SaveCallableResults>(
        () =>
            ({ state, history = true }) => {
                if (Object.values(state).length === 0) {
                    return { state, history };
                } else if (
                    history &&
                    snapshotsHistory.current.isBatching === false &&
                    snapshotsHistory.current.isDisabled === false &&
                    isTrackedAtomChanged(state)
                ) {
                    createStateHistorySnapshot();
                }

                if (state.ui) {
                    setUiAtomValue(state.ui);
                }

                if (state.plugins) {
                    setPluginsAtomValue(state.plugins);
                }

                if (state.hasOwnProperty("activeElement")) {
                    setActiveElementAtomValue(state.activeElement as string);
                }

                if (state.hasOwnProperty("highlightElement")) {
                    setHighlightElementAtomValue(state.highlightElement as string);
                }

                if (state.elements) {
                    updateElements(Object.values(state.elements));
                }

                if (state.sidebar) {
                    setSidebarAtomValue(state.sidebar);
                }

                return { state, history };
            },
        []
    );

    const saveCallablesResults = useMemo(() => {
        return composeSync([...(props.saveCallablesResults || []), defaultSaveCallablesResults]);
    }, [props.saveCallablesResults]);

    eventActionHandlerRef.current = useMemo<EventActionHandler>(
        () => ({
            getElementTree,
            on: (target, callable) => {
                const name = getEventActionClassName(target);
                if (!has(name)) {
                    set(name, new Map());
                }
                const events = get(name);
                if (hasCb(events, callable)) {
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
                const results = await triggerEventAction(ev, {} as unknown as PbState, []);
                saveCallablesResults({ state: results.state || {} });
                return results.state || {};
            },
            undo: () => {
                if (snapshotsHistory.current.busy === true) {
                    return;
                }
                snapshotsHistory.current.busy = true;
                const previousSnapshot = snapshotsHistory.current.past.pop();
                if (!previousSnapshot) {
                    snapshotsHistory.current.busy = false;
                    return;
                }
                const futureSnapshot = snapshotsHistory.current.present || takeSnapshot();
                snapshotsHistory.current.future.unshift(futureSnapshot);

                snapshotsHistory.current.present = previousSnapshot;

                goToSnapshot(previousSnapshot);
                snapshotsHistory.current.busy = false;
                updateElementTree();
            },
            redo: () => {
                if (snapshotsHistory.current.busy === true) {
                    return;
                }
                snapshotsHistory.current.busy = true;
                const nextSnapshot = snapshotsHistory.current.future.shift();
                if (!nextSnapshot) {
                    snapshotsHistory.current.present = null;
                    snapshotsHistory.current.busy = false;
                    return;
                } else if (snapshotsHistory.current.present) {
                    snapshotsHistory.current.past.push(snapshotsHistory.current.present);
                }
                snapshotsHistory.current.present = nextSnapshot;

                goToSnapshot(nextSnapshot);
                snapshotsHistory.current.busy = false;
                updateElementTree();
            },
            startBatch: () => {
                snapshotsHistory.current.isBatching = true;
            },
            endBatch: () => {
                snapshotsHistory.current.isBatching = false;
            },
            disableHistory: () => {
                snapshotsHistory.current.isDisabled = true;
            },
            enableHistory: () => {
                snapshotsHistory.current.isDisabled = false;
            }
        }),
        []
    );

    const triggerEventAction = async <T extends EventActionHandlerCallableArgs>(
        ev: EventAction<T>,
        initialState: PbState,
        initiator: string[]
    ): Promise<EventActionHandlerActionCallableResponse> => {
        if (initiator.length >= config.current.maxEventActionsNesting) {
            throw new Error(
                `Max (${
                    config.current.maxEventActionsNesting
                }) allowed levels of nesting actions reached: ${initiator.join(" -> ")}`
            );
        }

        if (initiator.length === 0) {
            // Reset elements taking part in the event processing at the beginning of the cycle
            eventElements.current = {};
        }

        const name = ev.getName();
        if (!has(name)) {
            throw new Error(`There is no event action that is registered with name "${name}".`);
        }
        const targetCallables = get(name);
        const results: Required<EventActionHandlerActionCallableResponse> = {
            state: {},
            actions: []
        };
        if (!targetCallables) {
            return results;
        }
        const args = ev.getArgs();
        const callables = Array.from(targetCallables.values());
        for (const cb of callables) {
            const r =
                (await cb(
                    // @ts-ignore TODO: figure this out!
                    getCallableState({ ...initialState, ...results.state }),
                    {
                        client: apolloClient,
                        eventActionHandler: eventActionHandlerRef.current as EventActionHandler
                    },
                    args
                )) || {};
            results.state = {
                ...results.state,
                ...(r.state || {})
            };

            results.actions.push(...r.actions);
        }

        eventElements.current = { ...eventElements.current, ...results.state.elements };

        for (const action of results.actions) {
            const r = await triggerEventAction(
                action,
                // @ts-ignore TODO: figure this out!
                getCallableState({ ...initialState, ...results.state }),
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
        <EventActionHandlerContext.Provider value={eventActionHandlerRef.current}>
            {children}
        </EventActionHandlerContext.Provider>
    );
});

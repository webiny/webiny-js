// @ts-nocheck
import {EventActionHandlerConfig, EventActionHandlerMeta} from "@webiny/app-page-builder/types";
import {PbState} from "@webiny/app-page-builder/editor/recoil/modules/types";

/**
 * Usages
 * subscribing to an event: handler.on(TargetEventClass, (args) => {your code})
 * unsubscribing from an event: handler.off(id)
 * triggering an event: handler.trigger(new TargetEventClass(args))
 *
 * removing all subscriptions: handler.clearRegistry()
 */
class EventActionHandler {
    private readonly _registry: RegistryType = new Map();
    private readonly _trackedStates: string[];
    private readonly _meta: EventActionHandlerMeta;
    private readonly _config: EventActionHandlerConfig;

    public get meta(): EventActionHandlerMeta {
        return this._meta;
    }

    public get config(): EventActionHandlerConfig {
        return this._config;
    }

    public constructor(
        trackedStates: (keyof Partial<PbState>)[] = [],
        meta: EventActionHandlerMeta,
        config: EventActionHandlerConfig
    ) {
        this._trackedStates = trackedStates;
        this._meta = meta;
        this._config = config;
    }

    // public on(target: TargetType, callable: EventActionCallable): UnregisterType {
    //     const name = this.getEventActionClassName(target);
    //     if (!this.has(name)) {
    //         this.set(name, new Map());
    //     }
    //     const events = this.get(name);
    //     if (this.hasCb(events, callable)) {
    //         throw new Error(
    //             `You cannot register event action "${name}" with identical function that already is registered.`
    //         );
    //     }
    //
    //     const id = Symbol(`eventActionCb:${name}`);
    //     events.set(id, callable);
    //     return () => {
    //         return this.off(id);
    //     };
    // }

    // public async trigger<T extends CallableArgsType>(
    //     ev: EventAction<T>
    // ): Promise<Partial<PbState>> {
    //     const results = await this.triggerEventAction(ev, {} as any, []);
    //
    //     this.saveCallablesResults(results.state);
    //
    //     return results.state;
    // }

    public clearRegistry(): void {
        this._registry.clear();
    }

    // private off(id: symbol): boolean {
    //     const registry = Array.from(this._registry.values());
    //     for (const list of registry) {
    //         if (!list.has(id)) {
    //             continue;
    //         }
    //         return list.delete(id);
    //     }
    //     return false;
    // }

    // private get(name: string): ListType {
    //     const list = this._registry.get(name);
    //     if (!list) {
    //         throw new Error(`There is no event action group "${name}" defined.`);
    //     }
    //     return list;
    // }
    //
    // private set(name: string, list: ListType): void {
    //     this._registry.set(name, list);
    // }
    //
    // private has(name: string): boolean {
    //     return this._registry.has(name);
    // }
    //
    // private hasCb(list: ListType, callable: EventActionCallable): boolean {
    //     const values = Array.from(list.values());
    //     return values.some(cb => cb === callable);
    // }

    // private getEventActionClassName(target: TargetType): string {
    //     const cls = new target();
    //     const name = cls.getName();
    //     if (!name) {
    //         throw new Error("Could not find class name.");
    //     }
    //     return name;
    // }

    // private saveCallablesResults(state: Partial<PbState>): void {
    //     if (Object.values(state).length === 0) {
    //         return;
    //     }
    //     // this is required because if we start the batch
    //     // there will be extra state in the undo
    //     // does not matter that tracked state did not change
    //     const setInBatch = this.isTrackedStateChanged(state);
    //     if (setInBatch) {
    //         //connectedBatchStart();
    //     }
    //
    //     if (state.ui) {
    //         const [uiAtomValue, setUiAtomValue] = this._state["ui"];
    //         setUiAtomValue(state.ui);
    //     }
    //     if (state.plugins) {
    //         console.log("state.plugins", state.plugins);
    //         const [pluginsAtom, setPluginsAtomValue] = this._state["plugins"];
    //         setPluginsAtomValue(state.plugins);
    //     }
    //     // if (state.page) {
    //     //     updateConnectedValue(pageAtom, state.page);
    //     // }
    //     // if (state.content) {
    //     //     updateConnectedValue(rootElementAtom, state.content);
    //     // }
    //     if (state.elements) {
    //         // TODO: somehow update several elements at once?
    //         this._state.updateElements(Object.values(state.elements));
    //     }
    //     // if (state.activeElement) {
    //     //     updateConnectedValue(activeElementAtom, state.activeElement);
    //     // }
    //     // if (state.highlightElement) {
    //     //     updateConnectedValue(highlightElementAtom, state.highlightElement);
    //     // }
    //     // if (state.sidebar) {
    //     //     updateConnectedValue(sidebarAtom, state.sidebar);
    //     // }
    //
    //     if (setInBatch) {
    //         //connectedBatchEnd();
    //     }
    // }

    private isTrackedStateChanged(state: Partial<PbState>): boolean {
        return this._trackedStates.some(key => state[key] !== undefined);
    }

    // private getCallableState(state: Partial<PbState>): PbState {
    //     return {
    //         // sidebar: await snapshot.getPromise(sidebarAtom),
    //         // rootElement: await snapshot.getPromise(rootElementAtom),
    //         // activeElement: await snapshot.getPromise(activeElementAtom),
    //         // highlightElement: await snapshot.getPromise(highlightElementAtom),
    //         // //elements: connectedAtomValue(elementsAtom),
    //         // page: await snapshot.getPromise(pageAtom),
    //         plugins: this._state.plugins[0],
    //         ui: this._state.ui[0],
    //         // //content: connectedAtomValue(rootElementAtom),
    //         // revisions: await snapshot.getPromise(revisionsAtom),
    //         ...state
    //     };
    // }

    // private async triggerEventAction<T extends CallableArgsType>(
    //     ev: EventAction<T>,
    //     initialState: PbState,
    //     initiator: string[]
    // ): Promise<EventActionHandlerActionCallableResponseType> {
    //     if (initiator.length >= this.config.maxEventActionsNesting) {
    //         throw new Error(
    //             `Max (${
    //                 this.config.maxEventActionsNesting
    //             }) allowed levels of nesting actions reached: ${initiator.join(" -> ")}`
    //         );
    //     }
    //     const name = ev.getName();
    //     if (!this.has(name)) {
    //         throw new Error(`There is no event action that is registered with name "${name}".`);
    //     }
    //     const targetCallables = this.get(name);
    //     const results: EventActionHandlerActionCallableResponseType = {
    //         state: {},
    //         actions: []
    //     };
    //     if (!targetCallables) {
    //         return results;
    //     }
    //     const args = ev.getArgs();
    //     const callables = Array.from(targetCallables.values());
    //     const callableState = this.getCallableState({ ...initialState, ...results.state });
    //     console.log("callableState", callableState);
    //     for (const cb of callables) {
    //         const r = (await cb(callableState, this.meta, args)) || ({} as any);
    //         results.state = {
    //             ...results.state,
    //             ...(r.state || {})
    //         };
    //         results.actions.push(...(r.actions || []));
    //     }
    //
    //     for (const action of results.actions) {
    //         const r = await this.triggerEventAction(
    //             action,
    //             callableState,
    //             initiator.concat([name])
    //         );
    //         results.state = {
    //             ...(results.state || {}),
    //             ...(r.state || {})
    //         };
    //     }
    //     console.log("trigger action results", results);
    //     return results;
    // }
}

import { BaseEventAction } from "@webiny/app-page-builder/editor/recoil/eventActions/BaseEventAction";
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
    connectedBatchEnd,
    connectedBatchStart,
    updateConnectedValue
} from "@webiny/app-page-builder/editor/recoil/modules/connected";
import { EventAction } from "./EventAction";

export type EventActionHandlerActionStateType = {
    ui: UiAtomType;
    plugins: PluginsAtomType;
    page: PageAtomType;
    elements: ElementsAtomType;
};
export type EventActionHandlerActionStateResponseType = {
    state?: {
        ui?: UiAtomType;
        plugins?: PluginsAtomType;
        page?: PageAtomType;
        elements?: ElementsAtomType;
    };
    actions?: BaseEventAction[];
};
export type MutationActionCallable<T, A extends any = any> = (state: T, args?: A) => T;

type EventActionCallableArgsType = {
    [key: string]: any;
};
export type EventActionCallableType<T extends EventActionCallableArgsType = any> = (
    state: EventActionHandlerActionStateType,
    args?: T
) => EventActionHandlerActionStateResponseType;

type ListType = Map<symbol, EventActionCallableType>;
type RegistryType = Map<string, ListType>;

type TargetType = { new (...args: any[]): EventAction<any> };
type UnregisterType = () => void;

/**
 * Usages
 * subscribing to an event: handler.on(TargetEventClass, (args) => {your code})
 * unsubscribing from an event: handler.off(id)
 * triggering an event: handler.trigger(new TargetEventClass(args))
 *
 * removing all subscriptions: handler.clearRegistry()
 */
export class EventActionHandler {
    private readonly _registry: RegistryType = new Map();

    public on(target: TargetType, callable: EventActionCallableType): UnregisterType {
        const name = this.getEventActionClassName(target);
        if (!this.has(name)) {
            this.set(name, new Map());
        }
        const events = this.get(name);
        if (this.hasCb(events, callable)) {
            throw new Error(
                `You cannot register event action "${name}" with identical function that already is registered.`
            );
        }

        const id = Symbol("eventActionCb");
        events.set(id, callable);
        return () => {
            this.off(id);
        };
    }

    public off(id: symbol): boolean {
        const registry = Array.from(this._registry.values());
        for (const list of registry) {
            if (!list.has(id)) {
                continue;
            }
            return list.delete(id);
        }
        return false;
    }

    public async trigger<T extends EventActionCallableArgsType>(
        ev: EventAction<T>
    ): Promise<number> {
        const name = ev.getName();
        if (!this.has(ev.getName())) {
            throw new Error(`There is no event action that is registered with name "${name}".`);
        }
        const targetCallables = this.get(name);
        if (!targetCallables) {
            return;
        }

        const initialState = {
            elements: connectedAtomValue(elementsAtom),
            page: connectedAtomValue(pageAtom),
            plugins: connectedAtomValue(pluginsAtom),
            ui: connectedAtomValue(uiAtom)
        };

        const args = ev.getArgs();
        const callables = Array.from(targetCallables.values());
        const results: EventActionHandlerActionStateResponseType = {
            state: {},
            actions: []
        };
        for (const cb of callables) {
            const r = await cb({ ...initialState, ...results.state }, args);
            results.state = {
                ...results.state,
                ...(r.state || {})
            };
            results.actions.push(...(r.actions || []));
        }
        const hasResults = Object.values(results.state).length > 0;
        if (hasResults) {
            this.saveState(results);
        }
        if (results.actions.length === 0) {
            return;
        }
        for (const action of results.actions) {
            await this.trigger(action);
        }
    }

    public clearRegistry(): void {
        this._registry.clear();
    }

    private get(name: string): ListType {
        const list = this._registry.get(name);
        if (!list) {
            throw new Error(`There is no event action group "${name}" defined.`);
        }
        return list;
    }

    private set(name: string, list: ListType): void {
        this._registry.set(name, list);
    }

    private has(name: string): boolean {
        return this._registry.has(name);
    }

    private hasCb(list: ListType, callable: EventActionCallableType): boolean {
        const values = Array.from(list.values());
        return values.some(cb => cb === callable);
    }

    private getEventActionClassName(target: TargetType): string {
        const cls = new target();
        const name = cls.getName() || cls.constructor.name;
        if (!name) {
            throw new Error("Could not find class name.");
        }
        return name;
    }

    private saveState({ state }: EventActionHandlerActionStateResponseType): void {
        connectedBatchStart();
        if (state.ui) {
            updateConnectedValue(uiAtom, state.ui);
        }
        if (state.plugins) {
            updateConnectedValue(pluginsAtom, state.plugins);
        }
        if (state.elements) {
            updateConnectedValue(elementsAtom, state.elements);
        }
        if (state.page) {
            updateConnectedValue(pageAtom, state.page);
        }

        connectedBatchEnd();
    }
}

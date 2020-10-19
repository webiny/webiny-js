import shortid from "shortid";
import { EventAction } from "./EventAction";

type EventActionHandlerEventsType = Map<string, Set<Function>>;

export enum EventActionHandlerStatusEnum {
    SUCCESS = 1,
    NO_CALLABLES = 0,
    ABORTED = -1
}

export enum EventActionHandlerSignal {
    IS_LAST = shortid.generate(),
    ABORT = shortid.generate()
}

type EventActionClassConstructor = { new (...args: any[]): EventAction<any> };
/**
 * Usages
 * subscribing to an event: handler.on(TargetEventClass, (args) => {your code})
 * unsubscribing from an event: handler.off(TargetEventClass, (args) => {your code; same function you subscribed with})
 * triggering an event: handler.trigger(new TargetEventClass(args))
 *
 * removing certain event: handler.removeEventFromRegistry(TargetEventClass)
 * removing all subscriptions: handler.clearRegistry()
 */
export class EventActionHandler {
    public static readonly SUCCESS = EventActionHandlerStatusEnum.SUCCESS;
    public static readonly NO_CALLABLES = EventActionHandlerStatusEnum.NO_CALLABLES;
    public static readonly ABORTED = EventActionHandlerStatusEnum.ABORTED;

    private readonly _registry: EventActionHandlerEventsType = new Map();

    public on(target: EventActionClassConstructor, callable: Function): void {
        const name = this.getEventActionClassName(target);
        if (!this.has(name)) {
            this.set(name, new Set());
        }
        const list = this.get(name);
        if (list.has(callable)) {
            throw new Error(
                `You cannot register event action "${name}" with identical function that already is registered.`
            );
        }
        list.add(callable);
    }

    public off(target: EventActionClassConstructor, callable: Function): void {
        const name = this.getEventActionClassName(target);
        if (!this.has(name)) {
            return;
        }
        const list = this.get(name);
        if (!list.has(callable)) {
            return;
        }
        list.delete(callable);
    }

    public async trigger<T extends object>(ev: EventAction<T>): Promise<number> {
        const name = ev.getName();
        if (!this.has(ev.getName())) {
            throw new Error(`There is no event action that is registered with name "${name}".`);
        }
        const targetCallables = this.get(name);
        if (!targetCallables) {
            return EventActionHandler.NO_CALLABLES;
        }
        const args = ev.getArgs();
        for (const fn of targetCallables.values()) {
            // TODO tbd if required to run in try/catch
            // and need to check if we will have status codes for triggers
            try {
                const result = await fn(args);
                if (result === EventActionHandlerSignal.IS_LAST) {
                    return EventActionHandler.SUCCESS;
                } else if (result === EventActionHandlerSignal.ABORT) {
                    return EventActionHandler.ABORTED;
                }
            } catch (ex) {
                throw new Error(
                    `Event action "${name}" produced some kind of exception, please check it.`
                );
            }
        }
        return EventActionHandler.SUCCESS;
    }

    public clearRegistry(): void {
        this._registry.clear();
    }

    private get(name: string): Set<Function> {
        const list = this._registry.get(name);
        if (!list) {
            throw new Error(`There is no event action group "${name}" defined.`);
        }
        return list;
    }

    private set(name: string, list: Set<Function>): void {
        this._registry.set(name, list);
    }

    private has(name: string): boolean {
        return this._registry.has(name);
    }

    private getEventActionClassName(target: EventActionClassConstructor): string {
        const cls = new target();
        const name = cls.getName() || cls.constructor.name;
        if (!name) {
            throw new Error("Could not find class name.");
        }
        return name;
    }
}

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

type EventActionClassConstructor = { new (...args: any[]): any };
/**
 * Usages
 * subscribing to an event: handler.subscribe(TargetEventClass, (args) => {your code})
 * unsubscribing from an event: handler.unsubscribe(TargetEventClass, (args) => {same function you subscribed with})
 * triggering an event: handler.trigger(new TargetEventClass(args))
 *
 * removing certain event: handler.removeEventFromRegistry(TargetEventClass)
 * removing all subscriptions and events: handler.clearEventRegistry()
 */
export class EventActionHandler {
    public static readonly SUCCESS = EventActionHandlerStatusEnum.SUCCESS;
    public static readonly NO_CALLABLES = EventActionHandlerStatusEnum.NO_CALLABLES;
    public static readonly ABORTED = EventActionHandlerStatusEnum.ABORTED;

    private readonly _eventRegistry: EventActionHandlerEventsType = new Map();
    private _eventActionRunning: string | null = null;

    public subscribe(target: EventActionClassConstructor, callable: Function): void {
        const name = this.getEventActionClassName(target);
        if (!this.has(name)) {
            this._eventRegistry.set(name, new Set());
        }
        const list = this.get(name);
        if (list.has(callable)) {
            throw new Error(`You cannot subscribe to one event with same function.`);
        }
        list.add(callable);
    }

    public unsubscribe(target: EventActionClassConstructor, callable: Function): void {
        const name = this.getEventActionClassName(target);
        if (!this.has(name)) {
            throw new Error(
                `It seems you want to unsubscribe to an event that you have not subscribed to with given function.`
            );
        }
        const list = this.get(name);
        const newSet = new Set<Function>();
        for (const fn of list.values()) {
            if (fn != callable) {
                newSet.add(fn);
            }
        }
        this.set(name, newSet);
    }

    public trigger<T extends object>(eventAction: EventAction<T>): number {
        if (this.isEventActionRunning()) {
            throw new Error(
                `Currently there is an action running "${this.getEventActionRunning()}".`
            );
        }
        const name = eventAction.getName();
        const targetCallables = this.get(name);
        if (!targetCallables) {
            return EventActionHandler.NO_CALLABLES;
        }
        this.setEventActionRunning(name);
        const args = eventAction.getArgs();
        for (const fn of targetCallables.values()) {
            try {
                const result = fn(args);
                if (result === EventActionHandlerSignal.IS_LAST) {
                    this.clearEventActionRunning();
                    return EventActionHandler.SUCCESS;
                } else if (result === EventActionHandlerSignal.ABORT) {
                    this.clearEventActionRunning();
                    return EventActionHandler.ABORTED;
                }
            } catch (ex) {
                this.clearEventActionRunning();
                throw new Error(
                    `Action event "${name}" produced some kind of exception, please check it.`
                );
            }
        }
        this.clearEventActionRunning();
        return EventActionHandler.SUCCESS;
    }

    public removeEventFromRegistry(target: EventActionClassConstructor): void {
        const name = this.getEventActionClassName(target);
        this._eventRegistry.set(name, new Set());
    }

    public clearEventRegistry(): void {
        this._eventRegistry.clear();
        this.clearEventActionRunning();
    }

    private get(name: string): Set<Function> {
        const list = this._eventRegistry.get(name);
        if (!list) {
            throw new Error(`There are no events with name ${name}.`);
        }
        return list;
    }

    private set(name: string, list: Set<Function>): void {
        this._eventRegistry.set(name, list);
    }

    private has(name: string): boolean {
        return this._eventRegistry.has(name);
    }

    private isEventActionRunning(): boolean {
        return !!this._eventActionRunning;
    }

    private setEventActionRunning(name: string): void {
        this._eventActionRunning = name;
    }

    private getEventActionRunning(): string | null {
        if (!this._eventActionRunning) {
            throw new Error("There is no event action running.");
        }
        return this._eventActionRunning;
    }

    private clearEventActionRunning(): void {
        this._eventActionRunning = null;
    }

    private getEventActionClassName(target: EventActionClassConstructor): string {
        if (target.constructor?.name && typeof target.constructor.name === "string") {
            return target.constructor.name;
        } else if (typeof target.name === "string") {
            return target.name;
        } else if (typeof target.name === "function") {
            return (target as any).name();
        }
        throw new Error("Could not find class name.");
    }
}

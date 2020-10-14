type EventActionHandlerEventsType = Map<string, Set<Function>>;

export enum EventActionHandlerStatusEnum {
    SUCCESS = 1,
    NO_CALLABLES = 0,
    ABORTED = -1
}

export enum EventActionHandlerSignal {
    IS_LAST = 0x001,
    ABORT = 0x999
}

export class EventActionHandler {
    public static readonly SUCCESS = EventActionHandlerStatusEnum.SUCCESS;
    public static readonly NO_CALLABLES = EventActionHandlerStatusEnum.NO_CALLABLES;
    public static readonly ABORTED = EventActionHandlerStatusEnum.ABORTED;

    private readonly _events: EventActionHandlerEventsType = new Map();
    private _eventActionRunning: string | null = null;

    public subscribe(name: string, callable: Function): void {
        if (!this.has(name)) {
            this._events.set(name, new Set());
        }
        const list = this.get(name);
        if (list.has(callable)) {
            throw new Error(`You cannot subscribe to one event with same function.`);
        }
        list.add(callable);
    }

    public unsubscribe(name: string, callable: Function): void {
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

    public trigger(name: string, args?: any): number {
        if (this.isEventActionRunning()) {
            throw new Error(`Currently there is an action running "${this._eventActionRunning}".`);
        }
        const targetCallables = this.get(name);
        if (!targetCallables) {
            return EventActionHandler.NO_CALLABLES;
        }
        this.setEventActionRunning(name);
        for (const fn of targetCallables.values()) {
            try {
                const result = fn(...(args || {}));
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

    public unsubscribeAll(): void {
        this._events.clear();
        this.clearEventActionRunning();
    }

    private get(name: string): Set<Function> {
        const list = this._events.get(name);
        if (!list) {
            throw new Error(`There are no events with name ${name}.`);
        }
        return list;
    }

    private set(name: string, list: Set<Function>): void {
        this._events.set(name, list);
    }

    private has(name: string): boolean {
        return this._events.has(name);
    }

    private isEventActionRunning(): boolean {
        return !!this._eventActionRunning;
    }

    private setEventActionRunning(name: string): void {
        this._eventActionRunning = name;
    }

    private clearEventActionRunning(): void {
        this._eventActionRunning = null;
    }
}

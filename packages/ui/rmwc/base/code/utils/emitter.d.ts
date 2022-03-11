export declare class EventEmitter {
    events_: {
        [evtName: string]: Array<Function>;
    };
    on(event: string, cb: Function): void;
    off(event: string, cb: Function): void;
    trigger(event: string, ...args: any): void;
}
export declare class ArrayEmitter<T> extends EventEmitter {
    array: T[];
    push(...items: T[]): number;
}

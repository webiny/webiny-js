declare type Context = Object;

declare class Namespace {
    active(): Context;
    set<T>(key: string, value: T): T;
    get(key: string): any;
    run(callback: Function): Context;
    runAndReturn<T>(callback: (...arguments: Array<any>) => T): T;
    bind(callback: Function): Function;
    bindEmitter(emitter: events$EventEmitter): void;
    createContext(): Context;
}

declare module "cls-hooked" {
    //declare export type Namespace = Namespace;

    declare module.exports: {
        createNamespace(name: string): Namespace,
        getNamespace(name: string): Namespace,
        destroyNamespace(name: string): void,
        reset(): void
    };
}

declare type Context = Object;

declare class cls$Namespace {
    active(): Context;
    set<T>(key: string, value: T): T;
    get(key: string): any;
    run(callback: Function): Context;
    runAndReturn<T>(callback: (...arguments: Array<any>) => T): T;
    bind(callback: Function): Function;
    bindEmitter(emitter: events$EventEmitter): void;
    createContext(): Context;
}

declare type cls$Storage = {
    createNamespace(name: string): cls$Namespace,

    getNamespace(name: string): cls$Namespace,

    destroyNamespace(name: string): void,

    reset(): void
};

declare module "cls-hooked" {
    declare export default cls$Storage
    declare export type Namespace = cls$Namespace;
}

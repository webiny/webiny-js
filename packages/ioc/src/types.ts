export interface AbstractConstructor<T = any> {
    prototype: T;
    name: string;
}

export interface Constructor<T = any, TArgs extends any[] = any[]> extends AbstractConstructor<T> {
    new (...args: TArgs): T;
}

export interface DefaultConstructor<T = any> {
    new (): T;
    prototype: T;
}

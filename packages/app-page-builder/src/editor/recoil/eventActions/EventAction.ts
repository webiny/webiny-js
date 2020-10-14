export interface EventAction<T extends any> {
    getName(): string;
    getArgs(): T;
}

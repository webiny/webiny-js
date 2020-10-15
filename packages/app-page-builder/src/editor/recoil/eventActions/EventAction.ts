export interface EventAction<T extends object> {
    getName(): string;
    getArgs(): T;
}

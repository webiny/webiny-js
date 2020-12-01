export type EventActionOptionsType = {
    isFirst?: boolean;
    isLast?: boolean;
};

export interface EventAction<T extends object> {
    getArgs(): T;
    getName(): string;
    getOptions(): EventActionOptionsType;
}

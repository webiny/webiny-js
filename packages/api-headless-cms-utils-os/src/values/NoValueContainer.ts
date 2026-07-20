export class NoValueContainer {
    private constructor() {
        //
    }

    public static create(): NoValueContainer {
        return new NoValueContainer();
    }

    public static is(value: unknown): boolean {
        return value instanceof NoValueContainer;
    }
}

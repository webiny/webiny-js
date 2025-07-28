// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type Command<TPayload> = {
    type: string;
};

export type CommandPayload<TCommand extends Command<unknown>> = TCommand extends Command<
    infer TPayload
>
    ? TPayload
    : never;

export function createCommand<T>(type: string): Command<T> {
    return { type } as Command<T>; // assert to preserve type info
}

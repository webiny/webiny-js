export type Args<T> = {
    table: string;
    meta?: boolean;
    [key: string]: any;
} & T;

export type CreateArgs = Args<{
    data: Record<string, any>;
}>;

export type UpdateArgs = Args<{
    data: Record<string, any>;
    query: Record<string, any>;
}>;

export type ReadArgs = Args<{
    query: Record<string, any>;
}>;

export type DeleteArgs = Args<{
    query: Record<string, any>;
}>;

export type CrudArgs = CreateArgs & ReadArgs & UpdateArgs & DeleteArgs;

export interface DbDriver {
    create: (args: CreateArgs) => {};
    read: (args: ReadArgs) => {};
    update: (args: UpdateArgs) => {};
    delete: (args: DeleteArgs) => {};
}

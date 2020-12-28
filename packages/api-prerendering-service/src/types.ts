export type HandlerResponse<TData = Record<string, any>, TError = Record<string, any>> = {
    data: TData;
    error: TError;
};

// Contains data about the previously performed render process for given URL.
export type DbRender = {
    PK: string;
    SK: string;
    TYPE: "ps.render";
    url: string;
    args?: Record<string, any>;
    configuration?: Record<string, any>;
    files: { name: string; type: string; meta: Record<string, any> }[];
};

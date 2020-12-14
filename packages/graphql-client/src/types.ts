import { DocumentNode } from "graphql/language/ast";

export type DeleteQueryArgs = {
    query: DocumentNode;
    variables?: Record<string, any>;
};

export type ReadQueryArgs = {
    query: DocumentNode;
    variables?: Record<string, any>;
};
export type WriteQueryArgs = {
    query: DocumentNode;
    variables?: Record<string, any>;
    result: Record<string, any>;
};

export type OnCacheChangeCallback = () => void | Promise<void>;
export type OnCacheChangeDestroyFunction = () => void;

export interface GraphQLClientCache {
    writeQuery(args: WriteQueryArgs): void | Promise<void>;
    readQuery<TResult = Record<string, any>>(args: ReadQueryArgs): TResult | Promise<TResult>;
    deleteQuery(args: DeleteQueryArgs): void | Promise<void>;
    onChange(callback: OnCacheChangeCallback): OnCacheChangeDestroyFunction;
}

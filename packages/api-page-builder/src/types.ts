import { GraphQLContext, Plugin } from "@webiny/api/types";

export type PbResolverListPagesPlugin = Plugin & {
    name: "pb-resolver-list-pages";
    resolve(params: {
        args: any;
        context: GraphQLContext;
    }): Promise<{ pages: any[]; totalCount: number }>;
};

export type PbModelPlugin = Plugin & {
    type: "pb-model";
    model(params: { models: any; createBase: Function }): void;
};

export type PbExtendModelsPlugin = Plugin & {
    type: "pb-extend-models";
    extend(params: { models: any }): void;
};

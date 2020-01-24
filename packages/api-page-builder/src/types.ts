import { GraphQLContext, Plugin } from "@webiny/api/types";

export type PbResolverListPagesPlugin = Plugin & {
    name: "pb-resolver-list-pages";
    resolve(params: {
        args: any;
        context: GraphQLContext;
    }): Promise<{ pages: any[]; totalCount: number }>;
};

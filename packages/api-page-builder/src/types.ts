import { GraphQLContext, Plugin } from "@webiny/api/types";

export type PbResolverListPagesPlugin = Plugin & {
    name: "pb-resolver-list-pages";
    resolve(params: {
        args: any;
        context: GraphQLContext;
    }): Promise<{ pages: any[]; totalCount: number }>;
};

export type PbInstallPlugin = Plugin & {
    name: "pb-install";
    before: ({ context: GraphQLContext, data: any }) => void;
    after: ({ context: GraphQLContext, data: any }) => void;
};

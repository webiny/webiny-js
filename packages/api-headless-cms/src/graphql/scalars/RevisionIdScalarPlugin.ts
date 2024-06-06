import { GraphQLScalarPlugin } from "@webiny/handler-graphql/types";
import { RevisionIdScalar } from "~/graphql/scalars/RevisionId";

export const createRevisionIdScalarPlugin = (): GraphQLScalarPlugin[] => {
    const plugin: GraphQLScalarPlugin = {
        name: "headlessCms.graphql.revisionIdScalar",
        type: "graphql-scalar",
        scalar: RevisionIdScalar
    };
    return [plugin];
};

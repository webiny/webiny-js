import type { GraphQLScalarPlugin } from "@webiny/api-graphql/types.js";
import { RevisionIdScalar } from "~/graphql/scalars/RevisionId.js";

export const createRevisionIdScalarPlugin = (): GraphQLScalarPlugin[] => {
    const plugin: GraphQLScalarPlugin = {
        name: "headlessCms.graphql.revisionIdScalar",
        type: "graphql-scalar",
        scalar: RevisionIdScalar
    };
    return [plugin];
};

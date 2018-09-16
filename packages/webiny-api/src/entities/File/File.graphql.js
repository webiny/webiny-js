// @flow
import { GraphQLString, GraphQLNonNull, GraphQLID, GraphQLInt, GraphQLObjectType } from "graphql";

export const FileType = new GraphQLObjectType({
    name: "FileType",
    fields: () => ({
        id: { type: new GraphQLNonNull(GraphQLID) },
        name: { type: new GraphQLNonNull(GraphQLString) },
        type: { type: new GraphQLNonNull(GraphQLString) },
        src: { type: new GraphQLNonNull(GraphQLString) },
        size: { type: new GraphQLNonNull(GraphQLInt) }
    })
});

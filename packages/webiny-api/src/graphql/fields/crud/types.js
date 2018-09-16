// @flow
import {
    GraphQLList,
    GraphQLString,
    GraphQLInt,
    GraphQLObjectType,
    GraphQLInputObjectType
} from "graphql";

const SearchInput = new GraphQLInputObjectType({
    name: "SearchInput",
    fields: {
        query: { type: GraphQLString, description: "Search query term" },
        fields: { type: new GraphQLList(GraphQLString), description: "Fields to search in" },
        operator: {
            type: GraphQLString,
            description:
                "If multiple fields are being searched, this operator will be applied to determine if the result applies."
        }
    }
});

const ListMeta = new GraphQLObjectType({
    name: "ListMeta",
    fields: () => ({
        count: { type: GraphQLInt },
        totalCount: { type: GraphQLInt },
        totalPages: { type: GraphQLInt },
        page: { type: GraphQLInt },
        perPage: { type: GraphQLInt },
        from: { type: GraphQLInt },
        to: { type: GraphQLInt },
        previousPage: { type: GraphQLInt },
        nextPage: { type: GraphQLInt }
    })
});

const List = (type: GraphQLObjectType) => {
    return new GraphQLObjectType({
        name: type.toString() + "List",
        fields: () => ({
            data: { type: new GraphQLList(type) },
            meta: { type: ListMeta }
        })
    });
};

export { List, SearchInput };

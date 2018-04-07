import {
    GraphQLList,
    GraphQLSchema,
    GraphQLString,
    GraphQLInt,
    GraphQLObjectType,
    GraphQLInputObjectType
} from "graphql";
import GraphQLJSON from "graphql-type-json";
import { User, Role } from "webiny-api-security";

const SearchInputType = new GraphQLInputObjectType({
    name: "SearchInputType",
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

const UserType = new GraphQLObjectType({
    name: "UserType",
    fields: () => ({
        id: { type: GraphQLString },
        email: { type: GraphQLString },
        firstName: { type: GraphQLString },
        roles: { type: new GraphQLList(RoleType) }
    })
});

const RoleType = new GraphQLObjectType({
    name: "RoleType",
    fields: () => ({
        id: { type: GraphQLString },
        name: { type: GraphQLString },
        slug: { type: GraphQLString }
    })
});

const ListMetaType = new GraphQLObjectType({
    name: "ListMetaType",
    fields: () => ({
        count: { type: GraphQLInt },
        totalCount: { type: GraphQLInt },
        totalPages: { type: GraphQLInt }
    })
});

const ListType = type => {
    return new GraphQLObjectType({
        name: (typeof type).toString(),
        fields: () => ({
            list: { type: new GraphQLList(type) },
            meta: { type: ListMetaType }
        })
    });
};

const QueryType = new GraphQLObjectType({
    name: "QueryType",
    fields: {
        user: {
            type: UserType,
            args: {
                id: { type: GraphQLString }
            },
            resolve(root, args) {
                // getUser
                if (req.identity.scopes.includes("getUser")) {
                    return User.findById(args.id);
                }
                throw new Error("Not authorized");
            }
        },
        users: {
            type: ListType(UserType),
            args: {
                page: { type: GraphQLInt },
                perPage: { type: GraphQLInt },
                filter: { type: GraphQLJSON },
                order: { type: GraphQLJSON },
                search: { type: SearchInputType }
            },
            async resolve(root, args) {
                const list = await User.find({
                    page: args.page,
                    perPage: args.perPage,
                    query: args.filter,
                    order: args.order,
                    search: args.search
                });
                const meta = list.getParams();
                meta.count = list.length;
                meta.totalCount = list.getMeta().totalCount;
                meta.totalPages = Math.ceil(meta.totalCount / meta.perPage);
                return { list, meta };
            }
        },
        roles: {
            type: new GraphQLList(RoleType),
            resolve() {
                return Role.find();
            }
        }
    }
});

const schema = new GraphQLSchema({
    query: QueryType
});

export default schema;

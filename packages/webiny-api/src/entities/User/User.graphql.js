// @flow
import { GraphQLObjectType, GraphQLString, GraphQLBoolean, GraphQLID, GraphQLList } from "graphql";
import { GraphQLDateTime } from "graphql-iso-date";

import User from "./User.entity";
import { crudFields, createField, schema } from "../../graphql";

export const UserType = new GraphQLObjectType({
    name: "SecurityUser",
    fields: () => ({
        id: { type: GraphQLID },
        email: { type: GraphQLString },
        firstName: { type: GraphQLString },
        lastName: { type: GraphQLString },
        fullName: { type: GraphQLString },
        gravatar: { type: GraphQLString },
        avatar: { type: schema.getType("FileType") },
        enabled: { type: GraphQLBoolean },
        groups: { type: new GraphQLList(schema.getType("SecurityGroup")) },
        policies: { type: new GraphQLList(schema.getType("SecurityPolicy")) },
        createdOn: { type: GraphQLDateTime }
    })
});

export const UserQueryType = new GraphQLObjectType({
    name: "SecurityUsers",
    fields: () => crudFields(User, schema.getType(UserType.name))
});

export const UserQueryField = () => createField(schema.getType(UserQueryType.name));

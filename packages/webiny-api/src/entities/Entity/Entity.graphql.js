// @flow
import { GraphQLObjectType, GraphQLString, GraphQLList, GraphQLID } from "graphql";
import { GraphQLDateTime } from "graphql-iso-date";
import GraphQLJSON from "graphql-type-json";
import { Group, Policy } from "./Entity";
import { crudFields, createField, schema } from "../../graphql";

//  Policy graphql types and fields
export const PolicyType = new GraphQLObjectType({
    name: "SecurityPolicy",
    fields: {
        id: { type: GraphQLID },
        name: { type: GraphQLString },
        createdOn: { type: GraphQLDateTime },
        slug: { type: GraphQLString },
        description: { type: GraphQLString },
        permissions: { type: GraphQLJSON }
    }
});

export const PolicyQueryType = new GraphQLObjectType({
    name: "SecurityPolicies",
    fields: () => crudFields(Policy, schema.getType(PolicyType.name))
});

export const PolicyQueryField = () => createField(schema.getType(PolicyQueryType.name));

//  Group graphql types and fields
export const GroupType = new GraphQLObjectType({
    name: "SecurityGroup",
    fields: {
        id: { type: GraphQLID },
        name: { type: GraphQLString },
        slug: { type: GraphQLString },
        createdOn: { type: GraphQLDateTime },
        description: { type: GraphQLString },
        policies: { type: new GraphQLList(PolicyType) }
    }
});

export const GroupQueryType = new GraphQLObjectType({
    name: "SecurityGroups",
    fields: () => crudFields(Group, schema.getType(GroupType.name))
});

export const GroupQueryField = () => createField(schema.getType(GroupQueryType.name));
